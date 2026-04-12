from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from app.core.config import settings
from supabase import create_client, Client

router = APIRouter()

# Initialize Supabase
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

class ToneAnalysisRequest(BaseModel):
    text: str
    user_id: str

@router.post("/analyze-tone")
async def analyze_tone(request: ToneAnalysisRequest):
    """
    分析用戶提供的範例文字，提取語氣風格
    """
    try:
        # Use Gemini to analyze the tone
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""請分析以下文字的語氣風格，並用一句話描述這種語氣（50字以內）：

「{request.text}」

請只回傳語氣描述，不要其他內容。例如：
- 親切友善，帶有溫暖的關懷
- 專業正式，語氣嚴謹
- 幽默風趣，輕鬆隨性
- 簡潔明瞭，直截了當
"""

        response = model.generate_content(prompt)
        tone_description = response.text.strip()
        
        # Store the analyzed tone in the database
        user_data = supabase.table('users').select('ai_settings').eq('id', request.user_id).execute()
        
        if user_data.data:
            current_settings = user_data.data[0].get('ai_settings', {})
            current_settings['analyzedTone'] = tone_description
            current_settings['sampleText'] = request.text
            current_settings['tone'] = 'custom'
            current_settings['customTone'] = tone_description
            
            supabase.table('users').update({
                'ai_settings': current_settings
            }).eq('id', request.user_id).execute()
        
        return {
            "tone_description": tone_description,
            "success": True
        }
        
    except Exception as e:
        print(f"Error analyzing tone: {e}")
        raise HTTPException(status_code=500, detail=str(e))
