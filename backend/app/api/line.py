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
    print(f"LINE Webhook received for user_id: {user_id}")
    print(f"X-Line-Signature: {x_line_signature}")
    
    body = await request.body()
    body_str = body.decode("utf-8")
    print(f"Webhook body length: {len(body_str)}")
    
    # 獲取該用戶的 LINE 設定
    config = await get_user_line_config(user_id)
    print(f"LINE config retrieved: token_exists={bool(config['line_channel_access_token'])}, secret_exists={bool(config['line_channel_secret'])}")
    
    line_bot_api = LineBotApi(config['line_channel_access_token'])
    handler = WebhookHandler(config['line_channel_secret'])
    
    try:
        events = handler.parser.parse(body_str, x_line_signature)
        print(f"Parsed {len(events)} events from LINE")
        for event in events:
            if isinstance(event, MessageEvent) and isinstance(event.message, TextMessage):
                print(f"Processing text message: {event.message.text}")
                await process_line_message(event, user_id, line_bot_api)
    except InvalidSignatureError:
        print("Invalid LINE signature error")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        print(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    print("Webhook processed successfully")
    return "OK"

async def process_line_message(event: MessageEvent, user_id: str, line_bot_api: LineBotApi):
    text = event.message.text
    line_user_id = event.source.user_id

    print(f"Processing message from LINE user: {line_user_id}")

    # 暫時使用簡單回應，避免 Google Cloud credentials 錯誤
    ai_response = "收到您的訊息！我還在學習中，稍後會有更智能的回應。"

    # 儲存對話到資料庫
    try:
        # 獲取用戶資料（顯示名稱和頭像）
        display_name = None
        picture_url = None
        try:
            profile = line_bot_api.get_profile(line_user_id)
            display_name = profile.display_name
            picture_url = profile.picture_url
            print(f"Got user profile: {display_name}")
        except Exception as e:
            print(f"Error getting user profile: {e}")

        # 檢查是否已存在該 LINE 用戶的對話
        existing_conversation = supabase.table('conversations').select('*').eq('line_user_id', line_user_id).eq('id', user_id).execute()

        conversation_id = None
        if existing_conversation.data:
            conversation_id = existing_conversation.data[0]['id']
            # 更新最後訊息和時間，同時更新用戶資料（如果有的話）
            update_data = {
                'last_message': text,
                'timestamp': 'now()',
                'unread': True
            }
            if display_name:
                update_data['display_name'] = display_name
            if picture_url:
                update_data['picture_url'] = picture_url

            supabase.table('conversations').update(update_data).eq('id', conversation_id).execute()
        else:
            # 創建新對話
            new_conversation_data = {
                'id': user_id,
                'user_name': display_name if display_name else f'LINE User {line_user_id[:8]}',
                'line_user_id': line_user_id,
                'last_message': text,
                'unread': True
            }
            if display_name:
                new_conversation_data['display_name'] = display_name
            if picture_url:
                new_conversation_data['picture_url'] = picture_url

            new_conversation = supabase.table('conversations').insert(new_conversation_data).execute()
            conversation_id = new_conversation.data[0]['id']

        # 先儲存用戶訊息（立即顯示）
        supabase.table('messages').insert({
            'conversation_id': conversation_id,
            'role': 'user',
            'content': text
        }).execute()

        print(f"User message saved to database: {conversation_id}")
    except Exception as e:
        print(f"Error saving user message to database: {e}")

    # 回覆用戶
    line_bot_api.reply_message(
        event.reply_token,
        TextSendMessage(text=ai_response)
    )

    # 然後儲存 AI 回應（異步，不影響回覆速度）
    try:
        supabase.table('messages').insert({
            'conversation_id': conversation_id,
            'role': 'ai',
            'content': ai_response
        }).execute()
        print(f"AI response saved to database: {conversation_id}")
    except Exception as e:
        print(f"Error saving AI response to database: {e}")
