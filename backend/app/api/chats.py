from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.config import settings
from supabase import create_client
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class TestMessageRequest(BaseModel):
    user_id: str
    message: str

class FAQItem(BaseModel):
    question: str
    answer: str
    category: str = "專業知識詢問"

# Initialize Supabase client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class ChatMessage(BaseModel):
    id: str
    role: str  # 'user' or 'ai'
    content: str
    timestamp: datetime

class ChatConversation(BaseModel):
    id: str
    user_name: str
    line_user_id: str
    last_message: str
    timestamp: datetime
    unread: bool

@router.get("/chats")
async def get_chats(user_id: str = None):
    """獲取當前用戶的所有對話記錄"""
    try:
        # 從 conversations 表獲取對話記錄（暫時不過濾 user_id 以便調試）
        response = supabase.table('conversations').select('*').order('timestamp', desc=True).execute()
        print(f"Fetched {len(response.data)} conversations")

        if response.data:
            return {"success": True, "chats": response.data}
        else:
            return {"success": True, "chats": []}
    except Exception as e:
        print(f"Error fetching chats: {e}")
        return {"success": True, "chats": []}

@router.get("/chats/{conversation_id}/messages")
async def get_chat_messages(conversation_id: str):
    """獲取特定對話的所有訊息"""
    try:
        print(f"Fetching messages for conversation_id: {conversation_id}")
        # 從 messages 表獲取訊息（不使用 order 參數）
        response = supabase.table('messages').select('*').eq('conversation_id', conversation_id).execute()

        print(f"Messages response: {response.data}")
        if response.data:
            # 在前端排序
            return {"success": True, "messages": response.data}
        else:
            return {"success": True, "messages": []}
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return {"success": True, "messages": []}

@router.post("/chats/send")
async def send_message(request_data: dict):
    """從儀表板發送訊息到 LINE"""
    try:
        conversation_id = request_data.get('conversation_id')
        message = request_data.get('message')

        if not conversation_id or not message:
            return {"success": False, "error": "Missing conversation_id or message"}

        # 獲取對話資訊
        conversation = supabase.table('conversations').select('*').eq('id', conversation_id).execute()

        if not conversation.data:
            return {"success": False, "error": "Conversation not found"}

        line_user_id = conversation.data[0]['line_user_id']
        user_id = conversation.data[0]['user_id']

        # 獲取用戶的 LINE 設定
        from app.api.line import get_user_line_config
        config = await get_user_line_config(user_id)

        # 發送訊息到 LINE
        from linebot import LineBotApi
        from linebot.models import TextSendMessage
        line_bot_api = LineBotApi(config['line_channel_access_token'])
        line_bot_api.push_message(line_user_id, TextSendMessage(text=message))

        # 儲存訊息到資料庫
        supabase.table('messages').insert({
            'conversation_id': conversation_id,
            'role': 'ai',  # 從儀表板發送的訊息視為 AI 回應
            'content': message,
            'timestamp': 'now()'
        }).execute()

        # 更新對話的最後訊息
        supabase.table('conversations').update({
            'last_message': message,
            'timestamp': 'now()'
        }).eq('id', conversation_id).execute()

        return {"success": True}
    except Exception as e:
        print(f"Error sending message: {e}")
        return {"success": False, "error": str(e)}

@router.post("/test-message")
async def test_message(request: TestMessageRequest):
    """發送測試訊息並獲取 AI 回應（不儲存到資料庫）"""
    try:
        user_id = request.user_id
        message = request.message

        # 獲取用戶 AI 設定
        from app.api.line import get_user_ai_settings
        ai_settings = await get_user_ai_settings(user_id)

        # 構建 system prompt
        system_prompt = "你是『數位店長』AI客服。"

        # 添加店家資料
        if ai_settings['store_name']:
            system_prompt += f"\n店家名稱：{ai_settings['store_name']}"
        if ai_settings['store_address']:
            system_prompt += f"\n店家地址：{ai_settings['store_address']}"
        if ai_settings['google_map_link']:
            system_prompt += f"\nGoogle Map 連結：{ai_settings['google_map_link']}"
        if ai_settings['store_phone']:
            system_prompt += f"\n店家電話：{ai_settings['store_phone']}"
        if ai_settings['store_type']:
            system_prompt += f"\n店家類型：{ai_settings['store_type']}"

        # 添加語氣設定
        tone_map = {
            'friendly': '親切友善',
            'professional': '專業正式',
            'humorous': '幽默風趣',
            'casual': '輕鬆隨性'
        }
        
        # 根據不同選項使用不同的語氣提示
        if ai_settings['tone'] == 'sample' and ai_settings.get('sampleText'):
            # 依照你的口氣：使用範例對話
            system_prompt += f"\n請參考以下對話範例的語氣風格來回覆：\n{ai_settings['sampleText']}\n請模仿這種語氣風格。"
        elif ai_settings['tone'] == 'custom' and ai_settings.get('customTone'):
            # 自訂語氣：使用簡短描述
            tone_description = ai_settings['customTone']
            system_prompt += f"\n請使用{tone_description}的語氣回覆。"
        else:
            # 預設語氣
            tone = tone_map.get(ai_settings['tone'], '親切友善')
            system_prompt += f"\n請使用{tone}的語氣回覆。"

        # 添加規則
        if ai_settings['rules'] and len(ai_settings['rules']) > 0:
            system_prompt += "\n\n回覆規則："
            for rule in ai_settings['rules']:
                if rule.get('condition') and rule.get('action'):
                    system_prompt += f"\n- 條件：{rule['condition']}，違反時：{rule['action']}"
            system_prompt += "\n如果使用者訊息符合上述任何條件，請按照違反時的處理方式回應。"

        # 使用 AI graph 生成回應
        try:
            from app.ai.graph import AgentState

            # 構建初始狀態
            initial_state = {
                "messages": [{"role": "user", "content": message}],
                "merchant_id": user_id,
                "intent": "",
                "faq_context": "",
                "booking_data": {},
                "next_node": "",
                "system_prompt": system_prompt
            }

            # 運行 AI graph
            from app.ai.graph import agent_app
            result = await agent_app.ainvoke(initial_state)

            # 獲取 AI 回應
            ai_response = result["messages"][-1]["content"]

            return {"success": True, "response": ai_response}
        except Exception as e:
            print(f"Error using AI graph for test: {e}")
            # 如果 AI 失敗，使用簡單回應
            ai_response = "收到您的測試訊息！我正在處理中。"
            return {"success": True, "response": ai_response}

    except Exception as e:
        print(f"Error processing test message: {e}")
        return {"success": False, "error": str(e)}

@router.get("/faq/{user_id}")
async def get_faq_items(user_id: str, category: str = None):
    """Get all FAQ items for a user, optionally filtered by category"""
    try:
        from app.services.faq import faq_service
        faq_items = await faq_service.list_faq_items(user_id, category)
        return {"success": True, "faqs": faq_items}
    except Exception as e:
        print(f"Error fetching FAQ items: {e}")
        return {"success": False, "error": str(e)}

@router.post("/faq/{user_id}")
async def add_faq_item(user_id: str, faq: FAQItem):
    """Add a new FAQ item"""
    try:
        from app.services.faq import faq_service
        faq_id = await faq_service.add_faq_item(user_id, faq.question, faq.answer, faq.category)
        return {"success": True, "faq_id": faq_id}
    except Exception as e:
        print(f"Error adding FAQ item: {e}")
        return {"success": False, "error": str(e)}

@router.delete("/faq/{user_id}/{faq_id}")
async def delete_faq_item(user_id: str, faq_id: str):
    """Delete an FAQ item"""
    try:
        from app.services.faq import faq_service
        await faq_service.delete_faq_item(user_id, faq_id)
        return {"success": True}
    except Exception as e:
        print(f"Error deleting FAQ item: {e}")
        return {"success": False, "error": str(e)}
