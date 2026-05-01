-- 清除所有測試資料（為跨日壓力測試準備）
DELETE FROM bookings 
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229';

-- 驗證清除結果
SELECT COUNT(*) as remaining_count
FROM bookings
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229';
