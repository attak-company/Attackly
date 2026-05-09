-- 在 bookings 表中新增 price 欄位
-- 執行此腳本前請確保已備份數據庫

-- 新增 price 欄位（數字類型，預設值為 0）
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;

-- 為現有的 bookings 記錄更新價格
-- 注意：這裡需要根據實際的服務設定來更新價格
-- 如果沒有服務設定，價格將保持為 0

-- 可選：為 price 欄位添加索引以提高查詢性能
-- CREATE INDEX IF NOT EXISTS idx_bookings_price ON bookings(price);

-- 可選：添加檢查約束確保價格不為負數
-- ALTER TABLE bookings ADD CONSTRAINT check_price_non_negative CHECK (price >= 0);
