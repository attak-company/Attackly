from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.schemas.booking import Booking, BookingCreate
from app.core.config import settings
from supabase import create_client, Client

class BookingService:
    def __init__(self):
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    async def get_all_bookings(self, merchant_id: str) -> List[Dict[str, Any]]:
        response = self.supabase.table("bookings").select("*").eq("merchant_id", merchant_id).execute()
        return response.data

    async def create_booking(self, booking_in: Dict[str, Any]) -> Dict[str, Any]:
        """
        建立新的預約紀錄到 Supabase
        """
        data = booking_in.copy()
        if "created_at" not in data:
            data["created_at"] = datetime.utcnow().isoformat()
        if "status" not in data:
            data["status"] = "pending"
            
        response = self.supabase.table("bookings").insert(data).execute()
        return response.data[0] if response.data else {}

    async def get_available_slots(self, merchant_id: str, date_str: str) -> List[str]:
        """
        查詢指定日期的可用預約時段 (實作簡易邏輯：排除已有預約的時段)
        """
        # 假設營業時間是 10:00 - 20:00，每小時一個時段
        all_slots = [f"{h:02d}:00" for h in range(10, 20)]
        
        # 查詢該商家該日期的現有預約
        # 注意：這裡需要處理時間區間，暫以簡易邏輯代替
        response = self.supabase.table("bookings") \
            .select("start_time") \
            .eq("merchant_id", merchant_id) \
            .execute()
            
        booked_times = []
        for b in response.data:
            dt = datetime.fromisoformat(b["start_time"].replace("Z", "+00:00"))
            if dt.strftime("%Y-%m-%d") == date_str:
                booked_times.append(dt.strftime("%H:%M"))
        
        # 過濾掉已被預約的時段
        available = [s for s in all_slots if s not in booked_times]
        return available

booking_service = BookingService()
