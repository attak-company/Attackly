from typing import List, Dict, Any
import google.generativeai as genai
from pinecone import Pinecone
from app.core.config import settings

class FAQService:
    def __init__(self):
        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index_name = "merchant-faq"
        self.embedding_model = "models/embedding-001"
        genai.configure(api_key=settings.GEMINI_API_KEY)

    async def get_relevant_faq(self, merchant_id: str, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        # Vector search implementation
        print(f"--- QUERYING FAQ FOR {merchant_id}: {query} ---")
        # Placeholder for vector search results
        return [
            {"question": "How to cancel?", "answer": "You can cancel 24h before."}
        ]

    async def add_faq_item(self, merchant_id: str, question: str, answer: str):
        # Implementation to add vector data
        pass

faq_service = FAQService()
