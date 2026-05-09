-- 移除 bookings 表中的 total_price 欄位
-- 執行此腳本前請確保已備份數據庫

-- 直接移除 total_price 欄位（如果不存在會報錯，但這是正常的）
ALTER TABLE bookings DROP COLUMN IF EXISTS total_price;

-- 確認 bookings 表的欄位結構
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND table_schema = 'public'
ORDER BY ordinal_position;
