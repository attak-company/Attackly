-- 診斷數據問題
-- 檢查 2026-04-19 的所有數據

SELECT id, type, category, customer_name, date, time, user_id FROM bookings WHERE date = '2026-04-19';

-- 檢查當前登錄用戶的數據
-- 請替換以下 user_id 為你的實際 user_id
-- SELECT * FROM bookings WHERE user_id = 'b186e2fd-9343-4bf6-9b2a-bdce18e95b04';

-- 檢查所有 bookings 的數據
-- SELECT id, type, category, customer_name, date, time, user_id FROM bookings ORDER BY date DESC, time DESC LIMIT 10;
