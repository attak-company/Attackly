-- 修正張惠妹的日期錯誤
-- 將錯誤的 4/28 00:30 修正為 4/29 00:30

-- 查找張惠妹的訂單
SELECT id, customer_name, start_time, end_time, date
FROM bookings
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
AND customer_name = '張惠妹';

-- 修正張惠妹的日期
UPDATE bookings
SET 
  start_time = '2026-04-29T00:30:00+08:00',
  end_time = '2026-04-29T02:30:00+08:00',
  date = '2026-04-29'
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
AND customer_name = '張惠妹';

-- 驗證修正結果
SELECT 
  customer_name,
  start_time,
  end_time,
  date,
  duration,
  is_finished,
  is_active,
  status
FROM bookings
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
ORDER BY start_time;
