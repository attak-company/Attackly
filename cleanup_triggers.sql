-- ========================================
-- 清除報錯源 - 刪除觸發器和函數
-- ========================================

-- 1. 使用 CASCADE 強制清除所有依賴關係
-- 這會自動幫你把連結在這個函數上的所有觸發器一併刪除
DROP FUNCTION IF EXISTS update_shop_bookings_v3_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_shop_customers_v3_updated_at() CASCADE;

-- 2. 確保欄位純淨 - 刪除 updated_at 欄位
ALTER TABLE shop_bookings_v3 DROP COLUMN IF EXISTS updated_at;
ALTER TABLE shop_customers_v3 DROP COLUMN IF EXISTS updated_at;

-- 5. 確認表結構純淨
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('shop_bookings_v3', 'shop_customers_v3')
ORDER BY table_name, ordinal_position;
