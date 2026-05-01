-- 清除王爸爸的錯誤訂單（日期錯位的訂單）
DELETE FROM bookings 
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
AND customer_name = '王爸爸';

-- 驗證清除結果
SELECT customer_name, start_time, end_time, date
FROM bookings
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
ORDER BY start_time;
