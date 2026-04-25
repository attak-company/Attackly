-- 徹底放寬約束：直接刪除 check_type 約束
-- 由前端邏輯控制數據驗證

-- 刪除約束
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_type;

-- 同步 type 與 category 的值
UPDATE bookings SET type = category WHERE type IS NULL OR type != category;

-- 更新所有數據，確保 type 與 category 一致
UPDATE bookings SET type = 'booking' WHERE category = 'booking' AND (type IS NULL OR type != 'booking');
UPDATE bookings SET type = 'activity' WHERE category = 'activity' AND (type IS NULL OR type != 'activity');
