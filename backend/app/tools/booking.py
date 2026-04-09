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

async def create_booking_fn(merchant_id: str, customer_name: str, service_id: str, start_time: str):
    """
    建立新的預約。
    輸入格式: merchant_id='UUID', customer_name='姓名', service_id='服務名稱/ID', start_time='YYYY-MM-DD HH:MM'
    """
    try:
        dt = datetime.strptime(start_time, "%Y-%m-%d %H:%M")
        end_time = dt + (datetime.strptime("01:00", "%H:%M") - datetime.strptime("00:00", "%H:%M"))
        
        booking_data = {
            "merchant_id": merchant_id,
            "customer_name": customer_name,
            "service_id": service_id,
            "start_time": dt.isoformat(),
            "end_time": end_time.isoformat()
        }
        
        result = await booking_service.create_booking(booking_data)
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@tool
async def create_booking_tool(merchant_id: str, customer_name: str, service_id: str, start_time: str):
    """建立新的預約。"""
    return await create_booking_fn(merchant_id, customer_name, service_id, start_time)
