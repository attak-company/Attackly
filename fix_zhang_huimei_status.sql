-- 修正張惠妹的狀態：標記為已結束
-- 因為現在是 4/29 晚上，凌晨的訂單已經過期

UPDATE bookings
SET 
  is_finished = true,
  is_active = false,
  status = 'completed'
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
