from typing import Annotated, TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
import operator
import google.generativeai as genai
from app.core.config import settings
from app.tools.booking import get_available_slots_fn, create_booking_fn
from app.tools.faq import search_faq
from app.core.redis import redis_client
import json
import hashlib

class AgentState(TypedDict):
    """
    State for the AI Booking Agent
    """
    messages: Annotated[List[Dict[str, str]], operator.add]
    merchant_id: str
    intent: str
    faq_context: str
    booking_data: Dict[str, Any]
    next_node: str
    system_prompt: str

# 設定 Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
# 定義工具列表供 Gemini
tools = [get_available_slots_fn, create_booking_fn]

# 初始化模型並綁定工具 (使用 Gemini 2.0 Flash)
model = genai.GenerativeModel('gemini-2.5-flash', tools=tools)

def get_cache_key(merchant_id: str, user_message: str, system_prompt: str) -> str:
    """Generate cache key for AI response"""
    content = f"{merchant_id}:{user_message}:{system_prompt}"
    return hashlib.md5(content.encode()).hexdigest()

def get_cached_response(cache_key: str) -> str:
    """Get cached response from Redis"""
    try:
        cached = redis_client.get(f"ai_response:{cache_key}")
        if cached:
            return cached
    except Exception as e:
        print(f"Redis cache get error: {e}")
    return None

def set_cached_response(cache_key: str, response: str, ttl: int = 3600):
    """Cache response in Redis"""
    try:
        redis_client.setex(f"ai_response:{cache_key}", ttl, response)
    except Exception as e:
        print(f"Redis cache set error: {e}")

def classify_intent(state: AgentState) -> AgentState:
    """
    使用 Gemini 判斷使用者的意圖：預約 (booking), FAQ (faq), 店家資料查詢 (store_info), 或 閒聊 (small_talk)
    """
    user_msg = state["messages"][-1]["content"]
    prompt = f"""請判斷以下訊息的意圖：'{user_msg}'

選項說明：
- booking：預約相關問題（如：我想預約、可以預約什麼時段）
- faq：一般常見問題（如：穿刺會痛嗎、需要多久時間、什麼價格）
- store_info：店家基本資料查詢（如：地址、電話、營業時間、位置、店家類型）
- small_talk：閒聊或問候（如：你好、哈囉）

請僅回傳選項單詞（booking/faq/store_info/small_talk）。"""
    
    # 這裡不帶工具，純分類 (使用 Gemini 2.0 Flash)
    simple_model = genai.GenerativeModel('gemini-2.5-flash')
    response = simple_model.generate_content(prompt)
    intent = response.text.strip().lower()
    
    # 防止異常回覆
    if intent not in ["booking", "faq", "store_info", "small_talk"]:
        intent = "small_talk"
        
    state["intent"] = intent
    print(f"--- 意圖分類：{intent} ---")
    return state

async def faq_retrieval(state: AgentState) -> AgentState:
    """
    調用 FAQ 搜尋工具
    """
    user_msg = state["messages"][-1]["content"]
    print(f"--- 執行 FAQ 檢索：{user_msg} ---")
    
    # 手動調用工具 (LangGraph 簡化版)
    res = await search_faq.ainvoke({"merchant_id": state["merchant_id"], "query": user_msg})
    state["faq_context"] = res
    print(f"--- 檢索到的 FAQ 內容：{res[:100] if len(res) > 100 else res} ---")
    return state

async def booking_handler(state: AgentState) -> AgentState:
    """
    調用預約工具
    """
    user_msg = state["messages"][-1]["content"]
    print(f"--- 執行預約邏輯：{user_msg} ---")
    
    # 讓 Gemini 決定要用哪個工具
    chat = model.start_chat(enable_automatic_function_calling=True)
    response = chat.send_message(f"商家ID是{state['merchant_id']}。使用者說：{user_msg}。請視情況查詢可用時段或建立預約。")
    
    # 將 AI 的內部思考或工具執行結果存入狀態
    state["messages"].append({"role": "assistant", "content": response.text})
    return state

def response_generator(state: AgentState) -> AgentState:
    """
    整合上下文，由 Gemini 生成最終回覆 (如果是 small_talk 或 faq 後的總結)
    """
    if state["intent"] == "booking" and len(state["messages"]) > 1:
        # 如果是預約意圖，booking_handler 可能已經回覆了
        return state

    user_msg = state["messages"][-1]["content"]
    intent = state["intent"]
    faq = state["faq_context"]

    # 使用自定義的 system prompt，如果沒有則使用預設
    system_prompt = state.get("system_prompt", f"你是『數位店長』AI客服。商戶ID是{state['merchant_id']}。目前意圖是{intent}。")
    
    if faq and "未找到相關的 FAQ 資料" not in faq and "搜尋 FAQ 時發生錯誤" not in faq:
        # 如果有找到 FAQ，強制使用 FAQ 內容
        system_prompt += f"\n\n【重要】以下是目前知識庫中找到的相關 FAQ 內容，請直接使用這些內容回答用戶的問題，不要自行編造答案：\n{faq}\n\n請嚴格依照上述 FAQ 內容回答，如果 FAQ 中沒有相關資訊，再說明無法回答。"
    elif faq:
        system_prompt += f"\n\n{faq}"

    # 檢查 Redis 快取
    cache_key = get_cache_key(state["merchant_id"], user_msg, system_prompt)
    cached_response = get_cached_response(cache_key)
    
    if cached_response:
        print(f"--- 使用快取回覆 ---")
        state["messages"].append({"role": "assistant", "content": cached_response})
        return state

    prompt = f"{system_prompt}\n使用者訊息：{user_msg}\n請回覆客人的問題。"
    
    print(f"--- System prompt (first 200 chars): {system_prompt[:200]}... ---")

    simple_model = genai.GenerativeModel('gemini-2.5-flash')
    response = simple_model.generate_content(prompt)
    response_text = response.text.strip()
    
    # 存入 Redis 快取
    set_cached_response(cache_key, response_text)
    
    state["messages"].append({"role": "assistant", "content": response_text})

    print(f"--- AI 總結回覆：{response_text[:20]}... ---")
    return state

# Define the Workflow
workflow = StateGraph(AgentState)

# Add Nodes
workflow.add_node("intent_classifier", classify_intent)
workflow.add_node("faq_node", faq_retrieval)
workflow.add_node("booking_node", booking_handler)
workflow.add_node("responder", response_generator)

# Define Edges
workflow.set_entry_point("intent_classifier")

def route_intent(state: AgentState):
    if state["intent"] == "faq":
        return "faq_node"
    elif state["intent"] == "booking":
        return "booking_node"
    # store_info 和 small_talk 都直接跳到 response_generator
    return "responder"

workflow.add_conditional_edges(
    "intent_classifier",
    route_intent,
    {
        "faq_node": "faq_node",
        "booking_node": "booking_node",
        "responder": "responder"
    }
)

workflow.add_edge("faq_node", "responder")
workflow.add_edge("booking_node", "responder")
workflow.add_edge("responder", END)

# Compile the graph
agent_app = workflow.compile()
