from fastapi import APIRouter, Request, Header, HTTPException
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage
from app.core.config import settings
from app.ai.graph import agent_app
import uuid
from supabase import create_client

router = APIRouter()

# 初始化 Supabase 客戶端
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

async def get_user_line_config(user_id: str):
    """從資料庫獲取用戶的 LINE 設定"""
    try:
        # 從 users 表讀取用戶的 LINE 設定
        response = supabase.table('users').select('line_channel_access_token, line_channel_secret').eq('id', user_id).execute()
        
        if response.data:
            user_config = response.data[0]
            return {
                'line_channel_access_token': user_config.get('line_channel_access_token', settings.LINE_CHANNEL_ACCESS_TOKEN),
                'line_channel_secret': user_config.get('line_channel_secret', settings.LINE_CHANNEL_SECRET)
            }
        else:
            # 如果找不到用戶，使用預設設定
            return {
                'line_channel_access_token': settings.LINE_CHANNEL_ACCESS_TOKEN,
                'line_channel_secret': settings.LINE_CHANNEL_SECRET
            }
    except Exception as e:
        print(f"Error fetching user LINE config: {e}")
        # 出錯時使用預設設定
        return {
            'line_channel_access_token': settings.LINE_CHANNEL_ACCESS_TOKEN,
            'line_channel_secret': settings.LINE_CHANNEL_SECRET
        }

@router.post("/{user_id}")
async def line_webhook(user_id: str, request: Request, x_line_signature: str = Header(None)):
    body = await request.body()
    body_str = body.decode("utf-8")
    
    # 獲取該用戶的 LINE 設定
    config = await get_user_line_config(user_id)
    
    line_bot_api = LineBotApi(config['line_channel_access_token'])
    handler = WebhookHandler(config['line_channel_secret'])
    
    try:
        events = handler.parser.parse(body_str, x_line_signature)
        for event in events:
            if isinstance(event, MessageEvent) and isinstance(event.message, TextMessage):
                await process_line_message(event, user_id, line_bot_api)
    except InvalidSignatureError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    return "OK"

async def process_line_message(event: MessageEvent, user_id: str, line_bot_api: LineBotApi):
    text = event.message.text
    
    # 這裡調用 LangGraph AI 流程
    initial_state = {
        "messages": [{"role": "user", "content": text}],
        "merchant_id": user_id,
        "intent": "",
        "faq_context": "",
        "booking_data": {},
        "next_node": ""
    }
    
    # 執行 AI 邏輯
    result = await agent_app.ainvoke(initial_state)
    
    ai_response = "不好意思，我還在學習中..."
    if result["messages"]:
        ai_response = result["messages"][-1]["content"]

    line_bot_api.reply_message(
        event.reply_token,
        TextSendMessage(text=ai_response)
    )
