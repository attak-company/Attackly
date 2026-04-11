from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.config import settings
from supabase import create_client
from typing import List, Optional
from datetime import datetime

router = APIRouter()

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
async def get_chats():
    """獲取當前用戶的所有對話記錄"""
    try:
        # 從 conversations 表獲取對話記錄
        response = supabase.table('conversations').select('*').order('timestamp', desc=True).execute()

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
        # 從 messages 表獲取訊息
        response = supabase.table('messages').select('*').eq('conversation_id', conversation_id).order('timestamp', asc=True).execute()

        print(f"Messages response: {response.data}")
        if response.data:
            return {"success": True, "messages": response.data}
        else:
            return {"success": True, "messages": []}
    except Exception as e:
        print(f"Error fetching messages: {e}")
        # 嘗試不使用 order 參數
        try:
            response = supabase.table('messages').select('*').eq('conversation_id', conversation_id).execute()
            print(f"Messages response (without order): {response.data}")
            if response.data:
                return {"success": True, "messages": response.data}
            else:
                return {"success": True, "messages": []}
        except Exception as e2:
            print(f"Error fetching messages without order: {e2}")
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
        user_id = conversation.data[0]['id']

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
            'content': message
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
