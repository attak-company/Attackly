-- 黃金測試資料腳本
-- 目標：驗證系統的三態視覺、進度條、source 標籤和活動功能
-- 基準日期：2026-04-28
-- 基準時間：16:07 (Asia/Taipei = UTC+8)
-- 專案唯一 user_id: 9671a408-107d-41cd-8064-b7924f8db229
-- 注意：已移除 time 欄位，統一使用 start_time

-- 清空現有 bookings 資料
DELETE FROM bookings WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229';

-- 插入測試資料
-- 注意：start_time 和 end_time 使用帶時區的 ISO 格式
-- 直接使用 +08 時區，避免自動轉換

-- 1. AI 預約 (已結束)：林志玲，14:00 開始，60 分鐘
-- 直接使用 +08 時區格式
INSERT INTO bookings (
  id,
  user_id,
  category,
  customer_name,
  service,
  service_type,
  service_abbr,
  date,
  duration,
  start_time,
  end_time,
  source,
  status,
  is_deleted,
  phone
) VALUES (
  'test_booking_001',
  '9671a408-107d-41cd-8064-b7924f8db229',
  'booking',
  '林志玲',
  '法式美甲',
  'nail',
  '指甲',
  '2026-04-28',
  60,
  '2026-04-28T14:00:00+08:00',
  '2026-04-28T15:00:00+08:00',
  'AI_Chatbot',
  'confirmed',
  false,
  '0912345678'
);

-- 2. 手動預約 (進行中)：阿鐘，15:45 開始，60 分鐘
-- 直接使用 +08 時區格式
INSERT INTO bookings (
  id,
  user_id,
  category,
  customer_name,
  service,
  service_type,
  service_abbr,
  date,
  duration,
  start_time,
  end_time,
  source,
  status,
  is_deleted,
  phone,
  tags
) VALUES (
  'test_booking_002',
  '9671a408-107d-41cd-8064-b7924f8db229',
  'booking',
  '阿鐘',
  '男士護理',
  'hair',
  '美髮',
  '2026-04-28',
  60,
  '2026-04-28T15:45:00+08:00',
  '2026-04-28T16:45:00+08:00',
  'manual',
  'confirmed',
  false,
  '0923456789',
  ARRAY['老客戶']
);

-- 3. 店內活動 (進行中)：店內大掃除，16:00 開始，30 分鐘
-- 直接使用 +08 時區格式
INSERT INTO bookings (
  id,
  user_id,
  category,
  service,
  date,
  duration,
  start_time,
  end_time,
  source,
  status,
  is_deleted,
  notes
) VALUES (
  'test_activity_001',
  '9671a408-107d-41cd-8064-b7924f8db229',
  'activity',
  '店內大掃除',
  '2026-04-28',
  30,
  '2026-04-28T16:00:00+08:00',
  '2026-04-28T16:30:00+08:00',
  'manual',
  'confirmed',
  false,
  '每週固定清潔'
);

-- 4. AI 預約 (未來)：廖老大，17:00 開始，60 分鐘
-- 直接使用 +08 時區格式
INSERT INTO bookings (
  id,
  user_id,
  category,
  customer_name,
  service,
  service_type,
  service_abbr,
  date,
  duration,
  start_time,
  end_time,
  source,
  status,
  is_deleted,
  ai_notes,
  phone
) VALUES (
  'test_booking_003',
  '9671a408-107d-41cd-8064-b7924f8db229',
  'booking',
  '廖老大',
  '美睫嫁接',
  'eyelash',
  '美睫',
  '2026-04-28',
  60,
  '2026-04-28T17:00:00+08:00',
  '2026-04-28T18:00:00+08:00',
  'AI_Chatbot',
  'pending',
  false,
  'AI 自動預約，來自 LINE 對話',
  '0975111111'
);

-- 驗證插入結果
SELECT 
  id,
  category,
  customer_name,
  service,
  date,
  time,
  duration,
  start_time,
  end_time,
  source,
  status,
  CASE 
    WHEN category = 'booking' THEN '預約'
    WHEN category = 'activity' THEN '活動'
  END as type
FROM bookings
ORDER BY start_time ASC;
