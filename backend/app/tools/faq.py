from langchain_core.tools import tool
from app.services.faq import faq_service

@tool
async def search_faq(merchant_id: str, query: str):
    """
    從商家的 FAQ 知識庫中搜尋答案。
    """
    try:
        faqs = await faq_service.get_relevant_faq(merchant_id, query, top_k=3)
        if faqs:
            # Format FAQ results
            faq_text = "\n\n".join([f"問題：{faq['question']}\n回答：{faq['answer']}" for faq in faqs])
            return faq_text
        else:
            return "未找到相關的 FAQ 資料。"
    except Exception as e:
        print(f"Error searching FAQ: {e}")
        return "搜尋 FAQ 時發生錯誤。"
