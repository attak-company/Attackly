-- 添加 duration 欄位到 bookings 表（如果不存在）
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration VARCHAR(20);
