-- 為 bookings 表添加 customer_id 外鍵關聯 customers 表
-- 在 Supabase SQL Editor 中執行此腳本

-- 添加 customer_id 欄位
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);

-- 確認欄位已添加
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'customer_id';
