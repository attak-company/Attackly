from fastapi import APIRouter, Request, Header, HTTPException
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError, LineBotApiError
from linebot.models import MessageEvent, TextMessage, TextSendMessage, FlexSendMessage, URIAction
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
        response = supabase.table('users').select('ai_settings, ai_enabled, store_name, store_address, store_google_map_link, store_phone, store_type, store_description, store_location_image').eq('id', user_id).execute()

        if response.data:
            user_data = response.data[0]
            ai_settings = user_data.get('ai_settings', {})
            return {
                'tone': ai_settings.get('tone', 'friendly'),
                'customTone': ai_settings.get('customTone', ''),
                'sampleText': ai_settings.get('sampleText', ''),
                'rules': ai_settings.get('rules', []),
                'ai_enabled': user_data.get('ai_enabled', True),
                'store_name': user_data.get('store_name', ''),
                'store_address': user_data.get('store_address', ''),
                'google_map_link': user_data.get('store_google_map_link', ''),
                'store_phone': user_data.get('store_phone', ''),
                'store_type': user_data.get('store_type', ''),
                'store_description': user_data.get('store_description', ''),
                'store_location_image': user_data.get('store_location_image', '')
            }
        else:
            # 預設設定
            return {
                'tone': 'friendly',
                'customTone': '',
                'sampleText': '',
                'rules': [],
                'ai_enabled': True,
                'store_name': '',
                'store_address': '',
                'google_map_link': '',
                'store_phone': '',
                'store_type': '',
                'store_description': '',
                'store_location_image': ''
            }
    except Exception as e:
        print(f"Error fetching user AI settings: {e}")
        # 出錯時使用預設設定
        return {
            'tone': 'friendly',
            'customTone': '',
            'sampleText': '',
            'rules': [],
            'ai_enabled': True,
            'store_name': '',
            'store_address': '',
            'google_map_link': '',
            'store_phone': '',
            'store_type': '',
            'store_description': '',
            'store_location_image': ''
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
    
    # Check if AI is enabled
    if ai_settings.get('ai_enabled') is False:
        print(f"AI is disabled for user {user_id}, skipping AI processing")
        # Save user message to database but don't generate AI response
        try:
            display_name = None
            picture_url = None
            try:
                profile = line_bot_api.get_profile(line_user_id)
                display_name = profile.display_name
                picture_url = profile.picture_url
            except Exception as e:
                print(f"Error getting user profile: {e}")

            existing_conversation = supabase.table('conversations').select('*').eq('line_user_id', line_user_id).eq('user_id', user_id).execute()

            conversation_id = None
            if existing_conversation.data:
                conversation_id = existing_conversation.data[0]['id']
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

            supabase.table('messages').insert({
                'conversation_id': conversation_id,
                'role': 'user',
                'content': text,
                'timestamp': 'now()'
            }).execute()

            print(f"User message saved to database (AI disabled): {conversation_id}")
        except Exception as e:
            print(f"Error saving user message: {e}")

        return {"status": "ok"}
    
    # Build system prompt with store information
    system_prompt = f"""你是『數位店長』AI客服。"""

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
    if ai_settings['store_description']:
        system_prompt += f"\n店家簡介：{ai_settings['store_description']}"

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
        tone_description = tone_map.get(ai_settings['tone'], '親切友善')
        system_prompt += f"\n請使用{tone_description}的語氣回覆。"

    # 添加硬性規則
    hardcoded_rules = ai_settings.get('hardcodedRules', {})
    if hardcoded_rules:
        enabled_hardcoded_rules = []
        if hardcoded_rules.get('noHallucination'):
            enabled_hardcoded_rules.append("無法確定就不要亂編造")
        if hardcoded_rules.get('driveBooking'):
            enabled_hardcoded_rules.append("對話導向成交與預約")
        if hardcoded_rules.get('comfortEmotions'):
            enabled_hardcoded_rules.append("遇到負面情緒安撫優先")
        if hardcoded_rules.get('prioritizeStore'):
            enabled_hardcoded_rules.append("回答以店家利益優先")
        
        if enabled_hardcoded_rules:
            system_prompt += f"\n\n【硬性規則】\n" + "\n".join([f"- {rule}" for rule in enabled_hardcoded_rules])

    # 添加自訂規則
    if ai_settings.get('rules'):
        rules_text = "\n".join([f"規則{i+1}：{rule}" for i, rule in enumerate(ai_settings['rules']) if rule.strip()])
        system_prompt += f"\n\n【自訂規則】\n{rules_text}"

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

    # 回覆用戶 - 使用 AI 生成的回應
    # 檢測是否為地址相關查詢
    address_keywords = ['地址', '在哪裡', '位置', '怎麼去', '如何到達', '地址是什麼', '店址', '位置在哪']
    is_address_query = any(keyword in text for keyword in address_keywords)

    if is_address_query and ai_settings.get('store_address') and ai_settings.get('google_map_link'):
        # 發送 AI 回應、店家圖片和 Google Map 按鈕
        messages = [TextSendMessage(text=ai_response)]
        
        # 如果有店家位置圖片，加入圖片訊息
        if ai_settings.get('store_location_image'):
            from linebot.models import ImageSendMessage
            messages.append(ImageSendMessage(
                original_content_url=ai_settings['store_location_image'],
                preview_image_url=ai_settings['store_location_image']
            ))
        
        # 加入 Google Map 按鈕
        flex_message = FlexSendMessage(
            alt_text='店家地址',
            contents={
                "type": "bubble",
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": "店家地址",
                            "weight": "bold",
                            "color": "#1D1D1F",
                            "size": "md"
                        },
                        {
                            "type": "text",
                            "text": ai_settings['store_address'],
                            "wrap": True,
                            "margin": "md",
                            "color": "#6E6E73",
                            "size": "sm"
                        }
                    ]
                },
                "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "button",
                            "style": "primary",
                            "height": "sm",
                            "action": {
                                "type": "uri",
                                "label": "開啟 Google Map 導航",
                                "uri": ai_settings['google_map_link']
                            }
                        }
                    ]
                }
            }
        )
        messages.append(flex_message)

        line_bot_api.reply_message(
            event.reply_token,
            messages
        )
    else:
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
            
            # 儲存 AI 回應
            response_content = ai_response
            
            supabase.table('messages').insert({
                'conversation_id': conversation_id,
                'role': 'ai',
                'content': response_content,
                'timestamp': 'now()'
            }).execute()
            print(f"AI response saved to database: {conversation_id}")
        except Exception as e:
            print(f"Error saving AI response to database: {e}")
    
    import asyncio
    asyncio.create_task(save_ai_response())
