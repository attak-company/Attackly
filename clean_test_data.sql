-- 清理測試資料腳本
-- 刪除所有測試資料（以 test_ 開頭的 id）

-- 刪除測試預約
DELETE FROM bookings 
WHERE id LIKE 'test_booking_%' 
   OR id LIKE 'test_activity_%';

-- 驗證刪除結果
SELECT COUNT(*) as remaining_test_records
FROM bookings 
WHERE id LIKE 'test_booking_%' 
   OR id LIKE 'test_activity_%';
