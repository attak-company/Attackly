from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.schemas.booking import Booking, BookingCreate
from app.core.config import settings
from supabase import create_client, Client

class BookingService:
    def __init__(self):
        self.supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    async def check_time_conflict(self, merchant_id: str, start_time: datetime, end_time: datetime, customer_phone: str = None) -> bool:
        """
        大功能：跨日衝突檢查 + 黑名單阻斷
        邏輯：抓取目標區間前後 24 小時的所有「已確認」訂單進行重疊判定。
        同時檢查顧客是否在黑名單中。
        """
        # 黑名單檢查
        if customer_phone:
            normalized_phone = ''.join(c for c in customer_phone if c.isdigit())
            customer_response = self.supabase.table("customers") \
                .select("is_blacklisted") \
                .eq("merchant_id", merchant_id) \
                .eq("phone", normalized_phone) \
                .maybeSingle()
            
            if customer_response.data and customer_response.data.get("is_blacklisted"):
                raise Exception("此客戶在黑名單中，無法進行預約")
        
        search_start = start_time - timedelta(days=1)
        search_end = end_time + timedelta(days=1)
        
        # 排除已取消的訂單
        response = self.supabase.table("bookings") \
            .select("start_time, end_time") \
            .eq("merchant_id", merchant_id) \
            .neq("status", "cancelled") \
            .gte("start_time", search_start.isoformat()) \
            .lte("end_time", search_end.isoformat()) \
            .execute()

        for b in response.data:
            b_start = datetime.fromisoformat(b["start_time"].replace("Z", "+00:00"))
            b_end = datetime.fromisoformat(b["end_time"].replace("Z", "+00:00"))
            # 經典判定：(新預約開始 < 已存預約結束) AND (新預約結束 > 已存預約開始)
            if start_time < b_end and end_time > b_start:
                return True 
        return False

    async def auto_update_expired_bookings(self, merchant_id: str):
        """
        大功能：自動狀態更新 + 最後消費日寫入
        邏輯：將所有結束時間小於當前時間的 confirmed 訂單更新為 completed，
        同時更新該客戶的 last_purchase_at 欄位。
        """
        now = datetime.utcnow().isoformat()
        
        # 獲取即將更新為 completed 的訂單
        response = self.supabase.table("bookings") \
            .select("customer_id, date") \
            .eq("merchant_id", merchant_id) \
            .eq("status", "confirmed") \
            .lt("end_time", now) \
            .execute()
        
        # 更新訂單狀態為 completed
        self.supabase.table("bookings") \
            .update({"status": "completed", "is_finished": True}) \
            .eq("merchant_id", merchant_id) \
            .eq("status", "confirmed") \
            .lt("end_time", now) \
            .execute()
        
        # 更新每個客戶的最後消費時間
        for booking in response.data or []:
            if booking.get("customer_id") and booking.get("date"):
                self.supabase.table("customers") \
                    .update({"last_purchase_at": booking["date"]}) \
                    .eq("id", booking["customer_id"]) \
                    .execute()

    async def get_all_bookings(self, merchant_id: str) -> List[Dict[str, Any]]:
        response = self.supabase.table("bookings").select("*").eq("merchant_id", merchant_id).execute()
        return response.data

    async def get_or_create_customer(self, merchant_id: str, name: str, phone: str = None) -> str:
        """
        大功能：顧客自動識別
        邏輯：優先用手機號碼找人，找不到則用姓名找。若都找不到則建立新顧客。
        """
        # 電話號碼標準化處理
        normalized_phone = None
        if phone:
            normalized_phone = ''.join(c for c in phone if c.isdigit())
        
        # 1. 嘗試搜尋現有顧客
        query = self.supabase.table("customers") \
            .select("id") \
            .eq("merchant_id", merchant_id)
        
        if normalized_phone:
            # 優先匹配手機號碼 (最具唯一性)
            res = query.eq("phone", normalized_phone).execute()
        else:
            # 退而求其次匹配姓名
            res = query.eq("customer_name", name).execute()

        if res.data:
            return res.data[0]["id"]

        # 2. 找不到人，建立新顧客紀錄
        new_customer = {
            "merchant_id": merchant_id,
            "customer_name": name,
            "phone": normalized_phone,
            "total_bookings": 0,
            "total_spending": 0,
            "no_show_count": 0
        }
        insert_res = self.supabase.table("customers").insert(new_customer).execute()
        return insert_res.data[0]["id"]

    async def create_booking(self, booking_in: Dict[str, Any]) -> Dict[str, Any]:
        """
        建立預約 (升級版)：整合衝突檢查 + 顧客自動關聯
        """
        start_dt = datetime.fromisoformat(booking_in["start_time"])
        end_dt = datetime.fromisoformat(booking_in["end_time"])

        # 寫入前的最後一道防線
        if await self.check_time_conflict(booking_in["merchant_id"], start_dt, end_dt, booking_in.get("phone")):
            raise Exception("此時段已被佔用，請重新選擇。")

        # 執行顧客關聯邏輯
        customer_id = await self.get_or_create_customer(
            merchant_id=booking_in["merchant_id"],
            name=booking_in["customer_name"],
            phone=booking_in.get("phone") # 假設 AI 有抓到電話
        )
        
        data = booking_in.copy()
        data["customer_id"] = customer_id # 正式建立關聯
        if "created_at" not in data:
            data["created_at"] = datetime.utcnow().isoformat()
        data["status"] = "pending" # AI 預約預設為待處理
            
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
