-- 修正王爸爸的錯誤時間數據
-- 將錯誤的 2026-04-27 16:00:00+00 修正為 2026-04-28 19:50:00+08

UPDATE bookings
SET 
  start_time = '2026-04-28T19:50:00+08:00',
  end_time = '2026-04-28T22:50:00+08:00',
  date = '2026-04-28'
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
AND customer_name = '王爸爸';

-- 驗證修正結果
SELECT 
  customer_name,
  start_time,
  end_time,
  date,
  duration
FROM bookings
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
AND customer_name = '王爸爸';
