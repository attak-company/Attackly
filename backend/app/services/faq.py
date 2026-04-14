from typing import List, Dict, Any, Optional
import google.generativeai as genai
from pinecone import Pinecone, ServerlessSpec
from app.core.config import settings
import uuid
import random
import hashlib

class FAQService:
    def __init__(self):
        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index_name = "merchant-faq"
        self.dimension = 768
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Initialize index
        self._initialize_index()
    
    def _initialize_index(self):
        """Initialize Pinecone index if it doesn't exist"""
        try:
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            if self.index_name not in existing_indexes:
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
                print(f"Created Pinecone index: {self.index_name}")
            else:
                print(f"Pinecone index {self.index_name} already exists")
            
            # List available Gemini models for debugging
            try:
                print("Available Gemini models:")
                for m in genai.list_models():
                    print(f"  - {m.name}")
            except Exception as e:
                print(f"Could not list models: {e}")
        except Exception as e:
            print(f"Error initializing Pinecone index: {e}")
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using simple hash-based approach as fallback"""
        try:
            # Try Gemini embedding first
            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_document"
            )
            embedding = result["embedding"]
            print(f"Generated embedding with {len(embedding)} dimensions")
            return embedding
        except Exception as e:
            print(f"Error generating embedding with Gemini: {e}")
            # Fallback to simple hash-based embedding
            print("Using fallback hash-based embedding")
            text_hash = hashlib.md5(text.encode()).hexdigest()
            # Convert hash to 768-dimensional vector
            embedding = []
            for i in range(self.dimension):
                char_idx = i % len(text_hash)
                char_val = int(text_hash[char_idx], 16)
                normalized = char_val / 15.0  # Normalize to 0-1
                embedding.append(normalized)
            return embedding
    
    async def add_faq_item(self, merchant_id: str, question: str, answer: str, category: str = "專業知識詢問") -> str:
        """Add FAQ item to vector database"""
        try:
            # Generate combined text for embedding
            combined_text = f"Question: {question}\nAnswer: {answer}"
            embedding = self._generate_embedding(combined_text)
            
            # Generate unique ID
            faq_id = str(uuid.uuid4())
            vector_id = f"{merchant_id}-{faq_id}"
            
            # Get index
            index = self.pc.Index(self.index_name)
            
            # Upsert to Pinecone
            index.upsert(
                vectors=[{
                    "id": vector_id,
                    "values": embedding,
                    "metadata": {
                        "merchant_id": merchant_id,
                        "faq_id": faq_id,
                        "question": question,
                        "answer": answer,
                        "category": category
                    }
                }]
            )
            
            print(f"Added FAQ item with ID: {faq_id}, Category: {category}")
            return faq_id
        except Exception as e:
            print(f"Error adding FAQ item: {e}")
            raise
    
    async def get_relevant_faq(self, merchant_id: str, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve relevant FAQ items based on query"""
        try:
            # Generate embedding for query
            query_embedding = self._generate_embedding(query)
            
            # Get index
            index = self.pc.Index(self.index_name)
            
            # Query Pinecone
            results = index.query(
                vector=query_embedding,
                top_k=top_k,
                filter={"merchant_id": merchant_id},
                include_metadata=True
            )
            
            # Format results
            faqs = []
            for match in results.matches:
                if match.metadata:
                    faqs.append({
                        "id": match.metadata.get("faq_id", match.id),
                        "question": match.metadata.get("question", ""),
                        "answer": match.metadata.get("answer", ""),
                        "score": match.score
                    })
            
            print(f"Found {len(faqs)} relevant FAQs for query: {query}")
            return faqs
        except Exception as e:
            print(f"Error retrieving FAQs: {e}")
            return []
    
    async def delete_faq_item(self, merchant_id: str, faq_id: str) -> bool:
        """Delete FAQ item from vector database"""
        try:
            # Get index
            index = self.pc.Index(self.index_name)
            
            # Construct vector ID
            vector_id = f"{merchant_id}-{faq_id}"
            
            # Delete from Pinecone
            index.delete(ids=[vector_id])
            
            print(f"Deleted FAQ item with ID: {faq_id}")
            return True
        except Exception as e:
            print(f"Error deleting FAQ item: {e}")
            raise
    
    async def list_faq_items(self, merchant_id: str, category: str = None) -> List[Dict[str, Any]]:
        """List all FAQ items for a merchant, optionally filtered by category"""
        try:
            # Get index
            index = self.pc.Index(self.index_name)
            
            # Build filter
            filter_dict = {"merchant_id": merchant_id}
            if category:
                filter_dict["category"] = category
            
            # Query all vectors for this merchant (using a dummy embedding)
            # Since Pinecone doesn't support listing all vectors directly,
            # we'll use a query with a high top_k value
            dummy_embedding = [0.0] * self.dimension
            results = index.query(
                vector=dummy_embedding,
                top_k=1000,
                filter=filter_dict,
                include_metadata=True
            )
            
            # Format results
            faqs = []
            for match in results.matches:
                if match.metadata:
                    faqs.append({
                        "id": match.metadata.get("faq_id", match.id),
                        "question": match.metadata.get("question", ""),
                        "answer": match.metadata.get("answer", ""),
                        "category": match.metadata.get("category", "專業知識詢問")
                    })
            
            return faqs
        except Exception as e:
            print(f"Error listing FAQ items: {e}")
            return []

# Create singleton instance
faq_service = FAQService()
