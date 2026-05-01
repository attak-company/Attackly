-- 資料庫遷移腳本：移除 time 欄位
-- 目標：統一使用 start_time 作為唯一時間標準
-- 專案唯一 user_id: 9671a408-107d-41cd-8064-b7924f8db229

-- 步驟 1：備份現有資料（可選）
-- CREATE TABLE bookings_backup AS SELECT * FROM bookings;

-- 步驟 2：移除 time 欄位
ALTER TABLE bookings DROP COLUMN IF EXISTS time;

-- 步驟 3：驗證欄位已移除
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
