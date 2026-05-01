-- 修復髒資料：將 end_time 早於 start_time 的記錄修正
-- 邏輯：end_time = start_time + duration * interval '1 minute'

-- 首先查看有多少筆異常資料
SELECT 
    id,
    customer_name,
    date,
    time,
    start_time,
    end_time,
    duration,
    CASE 
        WHEN end_time < start_time THEN '異常'
        ELSE '正常'
    END as status
FROM bookings
WHERE end_time < start_time
ORDER BY date DESC, time DESC;

-- 刪除異常資料（end_time 早於 start_time）
DELETE FROM bookings
WHERE end_time < start_time;

-- 驗證修復結果
SELECT 
    id,
    customer_name,
    date,
    time,
    start_time,
    end_time,
    duration,
    CASE 
        WHEN end_time < start_time THEN '異常'
        ELSE '正常'
    END as status
FROM bookings
WHERE end_time < start_time
ORDER BY date DESC, time DESC;

-- 如果沒有異常資料，應該返回 0 筆
