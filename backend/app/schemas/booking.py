from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class BookingBase(BaseModel):
    merchant_id: str
    customer_name: str
    service_id: str
    start_time: datetime
    end_time: datetime

class BookingCreate(BookingBase):
    pass

class Booking(BookingBase):
    id: str
    status: str = "pending"
    created_at: datetime

    class Config:
        from_attributes = True
