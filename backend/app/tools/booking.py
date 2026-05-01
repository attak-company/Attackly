from typing import List, Dict, Any
from langchain_core.tools import tool
from app.services.booking import booking_service
from datetime import datetime

async def get_available_slots_fn(merchant_id: str, date: str) -> List[str]:
    """
    查詢指定日期商家可用的預約時段。
    輸入格式: date='YYYY-MM-DD', merchant_id='UUID'
    回傳範例: ["10:00", "11:00", "15:00"]
    """
    return await booking_service.get_available_slots(merchant_id, date)

@tool
async def get_available_slots(merchant_id: str, date: str) -> List[str]:
    """查詢指定日期商家可用的預約時段。"""
    return await get_available_slots_fn(merchant_id, date)

async def create_booking_fn(
    merchant_id: str, 
    customer_name: str, 
    service_id: str, 
    start_time: str, 
    duration_hours: float = 1.0,  # 改為動態參數：讓 AI 可以傳入時長，預設 1 小時
    customer_phone: str = None  # 新增：要求 AI 必須詢問顧客電話
):
    """
    建立新的預約。
    輸入格式: start_time='YYYY-MM-DD HH:MM', duration_hours=1.5, customer_phone='0912345678'
    注意：customer_phone 為必填參數，AI 必須詢問顧客電話號碼。
    """
    try:
        dt = datetime.strptime(start_time, "%Y-%m-%d %H:%M")
        # 動態計算結束時間
        end_time = dt + timedelta(hours=duration_hours)
        
        booking_data = {
            "merchant_id": merchant_id,
            "customer_name": customer_name,
            "service_id": service_id,
            "start_time": dt.isoformat(),
            "end_time": end_time.isoformat(),
            "customer_phone": customer_phone  # 新增：傳入電話號碼
        }
        
        # 這裡會觸發你剛改好的 Service 層「衝突檢查」
        result = await booking_service.create_booking(booking_data)
        return {"status": "success", "data": result}
    except Exception as e:
        # 如果是 Service 層噴出的「時段被佔用」，這裡會回傳給 AI
        return {"status": "error", "message": str(e)}

@tool
async def create_booking_tool(merchant_id: str, customer_name: str, service_id: str, start_time: str, duration_hours: float = 1.0):
    """建立新的預約。"""
    return await create_booking_fn(merchant_id, customer_name, service_id, start_time, duration_hours)
