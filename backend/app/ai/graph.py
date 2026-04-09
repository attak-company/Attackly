from typing import Annotated, TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
import operator
import google.generativeai as genai
from app.core.config import settings
from app.tools.booking import get_available_slots_fn, create_booking_fn
from app.tools.faq import search_faq
import json

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

# 設定 Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
# 定義工具列表供 Gemini
tools = [get_available_slots_fn, create_booking_fn]

# 初始化模型並綁定工具
model = genai.GenerativeModel('gemini-1.5-pro', tools=tools)

def classify_intent(state: AgentState) -> AgentState:
    """
    使用 Gemini 判斷使用者的意圖：預約 (booking), FAQ (faq), 或 閒聊 (small_talk)
    """
    user_msg = state["messages"][-1]["content"]
    prompt = f"請判斷以下訊息的意圖：'{user_msg}'。選項有：booking, faq, small_talk。僅回傳選項單詞。"
    
    # 這裡不帶工具，純分類
    simple_model = genai.GenerativeModel('gemini-1.5-pro')
    response = simple_model.generate_content(prompt)
    intent = response.text.strip().lower()
    
    # 防止異常回覆
    if intent not in ["booking", "faq", "small_talk"]:
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
    
    system_prompt = f"你是『數位店長』AI客服。商戶ID是{state['merchant_id']}。目前意圖是{intent}。"
    if faq:
        system_prompt += f"\n參考知識庫內容：{faq}"
    
    prompt = f"{system_prompt}\n使用者訊息：{user_msg}\n請以親切專業的語氣回覆客人的問題。"
    
    simple_model = genai.GenerativeModel('gemini-1.5-pro')
    response = simple_model.generate_content(prompt)
    state["messages"].append({"role": "assistant", "content": response.text.strip()})
    
    print(f"--- AI 總結回覆：{response.text.strip()[:20]}... ---")
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
