from langchain_core.tools import tool
from app.services.faq import faq_service

@tool
def search_faq(merchant_id: str, query: str):
    """
    從商家的 FAQ 知識庫中搜尋答案。
    """
    # This would call faq_service.get_relevant_faq
    return "Merchant policy: 24h cancellation required."
