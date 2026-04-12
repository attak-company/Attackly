from fastapi import APIRouter, Request, Header, HTTPException
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError, LineBotApiError
from linebot.models import MessageEvent, TextMessage, TextSendMessage
from app.core.config import settings
from app.ai.graph import agent_app
import uuid
from supabase import create_client
from pydantic import BaseModel

router = APIRouter()

class VerifyCredentialsRequest(BaseModel):
    channel_access_token: str
    channel_secret: str

# 初始化 Supabase 客戶端
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

@router.post("/verify")
async def verify_credentials(request: VerifyCredentialsRequest):
    """驗證 LINE credentials 格式"""
    print(f"驗證請求: token={request.channel_access_token[:20] if request.channel_access_token else 'None'}..., secret={request.channel_secret[:10] if request.channel_secret else 'None'}...")
    
    if not request.channel_access_token or not request.channel_secret:
        return {
            "valid": False,
            "message": "Channel Access Token 和 Channel Secret 都不能為空"
        }
    
    # 檢查 Channel Secret 格式：32 字符
    if len(request.channel_secret) != 32:
        return {
            "valid": False,
            "message": "Channel Secret 必須是 32 個字符"
        }
    
    # 如果格式正確，返回驗證成功
    return {
        "valid": True,
        "message": "格式正確"
    }

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

async def get_user_ai_settings(user_id: str):
    """從資料庫獲取用戶的 AI 設定和店家資料"""
    try:
        response = supabase.table('users').select('ai_settings, store_name, store_address, store_phone, store_type').eq('id', user_id).execute()

        if response.data:
            user_data = response.data[0]
            ai_settings = user_data.get('ai_settings', {})
            return {
                'tone': ai_settings.get('tone', 'friendly'),
                'rules': ai_settings.get('rules', []),
                'store_name': user_data.get('store_name', ''),
                'store_address': user_data.get('store_address', ''),
                'store_phone': user_data.get('store_phone', ''),
                'store_type': user_data.get('store_type', '')
            }
        else:
            # 預設設定
            return {
                'tone': 'friendly',
                'rules': [],
                'store_name': '',
                'store_address': '',
                'store_phone': '',
                'store_type': ''
            }
    except Exception as e:
        print(f"Error fetching user AI settings: {e}")
        # 出錯時使用預設設定
        return {
            'tone': 'friendly',
            'rules': [],
            'store_name': '',
            'store_address': '',
            'store_phone': '',
            'store_type': ''
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

    # 獲取用戶的 AI 設定和店家資料
    ai_settings = await get_user_ai_settings(user_id)
    print(f"AI settings: tone={ai_settings['tone']}, rules_count={len(ai_settings['rules'])}")

    # 構建 system prompt
    system_prompt = "你是『數位店長』AI客服。"

    # 添加店家資料
    if ai_settings['store_name']:
        system_prompt += f"\n店家名稱：{ai_settings['store_name']}"
    if ai_settings['store_address']:
        system_prompt += f"\n店家地址：{ai_settings['store_address']}"
    if ai_settings['store_phone']:
        system_prompt += f"\n店家電話：{ai_settings['store_phone']}"
    if ai_settings['store_type']:
        system_prompt += f"\n店家類型：{ai_settings['store_type']}"

    # 添加語氣設定
    tone_map = {
        'friendly': '親切友善',
        'professional': '專業正式',
        'casual': '輕鬆隨性'
    }
    system_prompt += f"\n請使用{tone_map.get(ai_settings['tone'], '親切友善')}的語氣回覆。"

    # 添加規則
    if ai_settings['rules']:
        system_prompt += "\n請遵守以下回覆規則："
        for rule in ai_settings['rules']:
            if rule.get('condition') and rule.get('action'):
                system_prompt += f"\n- 條件：{rule['condition']}，違反時：{rule['action']}"

    print(f"System prompt: {system_prompt[:200]}...")

    # 使用 AI graph 生成回應
    try:
        from app.ai.graph import AgentState

        # 構建初始狀態
        initial_state = {
            "messages": [{"role": "user", "content": text}],
            "merchant_id": user_id,
            "intent": "",
            "faq_context": "",
            "booking_data": {},
            "next_node": "",
            "system_prompt": system_prompt
        }

        # 運行 AI graph
        result = await agent_app.ainvoke(initial_state)

        # 獲取 AI 回應
        ai_response = result["messages"][-1]["content"]
        print(f"AI response generated: {ai_response[:50]}...")

    except Exception as e:
        print(f"Error using AI graph: {e}")
        # 如果 AI 失敗，使用簡單回應
        ai_response = "收到您的訊息！我正在處理中。"

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

        # 檢查是否已存在該 LINE 用戶的對話（針對當前後端用戶）
        existing_conversation = supabase.table('conversations').select('*').eq('line_user_id', line_user_id).eq('user_id', user_id).execute()

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
            # 創建新對話（使用唯一 UUID）
            new_conversation_data = {
                'id': str(uuid.uuid4()),
                'user_id': user_id,
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
            'content': text,
            'timestamp': 'now()'
        }).execute()

        print(f"User message saved to database: {conversation_id}")
    except Exception as e:
        print(f"Error saving user message to database: {e}")

    # 回覆用戶
    line_bot_api.reply_message(
        event.reply_token,
        TextSendMessage(text=ai_response)
    )

    # 異步儲存 AI 回應（不阻塞 webhook 響應）
    async def save_ai_response():
        try:
            # 延遲 0.5 秒確保前端輪詢有時間檢測到用戶訊息
            import asyncio
            await asyncio.sleep(0.5)
            
            supabase.table('messages').insert({
                'conversation_id': conversation_id,
                'role': 'ai',
                'content': ai_response,
                'timestamp': 'now()'
            }).execute()
            print(f"AI response saved to database: {conversation_id}")
        except Exception as e:
            print(f"Error saving AI response to database: {e}")
    
    import asyncio
    asyncio.create_task(save_ai_response())
