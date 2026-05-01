-- 跨日壓力測試資料
-- 基準時間：2026-04-28 23:33 (台北時間)
-- 測試目標：驗證系統處理跨日訂單的能力

-- 1. 周杰倫：跨日進行中（紅色）
-- 時間：22:30 (4/28) - 01:30 (4/29)，180 分鐘
-- 當前時間 23:33 時應為進行中
INSERT INTO bookings (
  id,
  user_id,
  category,
  service,
  customer_name,
  phone,
  date,
  duration,
  start_time,
  end_time,
  is_finished,
  is_active,
  status,
  source,
  is_deleted
) VALUES (
  gen_random_uuid()::text,
  '9671a408-107d-41cd-8064-b7924f8db229',
  'booking',
  '燙髮',
  '周杰倫',
  '0912345678',
  '2026-04-28',
  180,
  '2026-04-28T22:30:00+08:00',
  '2026-04-29T01:30:00+08:00',
  false,
  true,
  'confirmed',
  'manual',
  false
);

-- 2. 蔡依林：跨日剛結束（灰色）
-- 時間：21:00 (4/28) - 23:15 (4/28)，135 分鐘
-- 當前時間 23:33 時應為已結束
INSERT INTO bookings (
  id,
  user_id,
  category,
  service,
  customer_name,
  phone,
  date,
  duration,
  start_time,
  end_time,
  is_finished,
  is_active,
  status,
  source,
  is_deleted
) VALUES (
  gen_random_uuid()::text,
  '9671a408-107d-41cd-8064-b7924f8db229',
  'booking',
  '染髮',
  '蔡依林',
  '0923456789',
  '2026-04-28',
  135,
  '2026-04-28T21:00:00+08:00',
  '2026-04-28T23:15:00+08:00',
  true,
  false,
  'completed',
  'manual',
  false
);

-- 3. 張惠妹：跨日未來單（白色）
-- 時間：00:30 (4/29) - 02:30 (4/29)，120 分鐘
-- 當前時間 23:33 時應為未來預約
INSERT INTO bookings (
  id,
  user_id,
  category,
  service,
  customer_name,
  phone,
  date,
  duration,
  start_time,
  end_time,
  is_finished,
  is_active,
  status,
  source,
  is_deleted
) VALUES (
  gen_random_uuid()::text,
  '9671a408-107d-41cd-8064-b7924f8db229',
  'booking',
  '指甲',
  '張惠妹',
  '0934567890',
  '2026-04-29',
  120,
  '2026-04-29T00:30:00+08:00',
  '2026-04-29T02:30:00+08:00',
  false,
  false,
  'confirmed',
  'manual',
  false
);

-- 4. 阿信：極短突發單（紅色）
-- 時間：23:30 (4/28) - 00:00 (4/29)，30 分鐘
-- 當前時間 23:33 時應為進行中（剛開始 3 分鐘）
INSERT INTO bookings (
  id,
  user_id,
  category,
  service,
  customer_name,
  phone,
  date,
  duration,
  start_time,
  end_time,
  is_finished,
  is_active,
  status,
  source,
  is_deleted
) VALUES (
  gen_random_uuid()::text,
  '9671a408-107d-41cd-8064-b7924f8db229',
  'booking',
  '修剪',
  '阿信',
  '0945678901',
  '2026-04-28',
  30,
  '2026-04-28T23:30:00+08:00',
  '2026-04-29T00:00:00+08:00',
  false,
  true,
  'confirmed',
  'manual',
  false
);

-- 驗證注入結果
SELECT 
  customer_name,
  start_time,
  end_time,
  duration,
  is_finished,
  is_active,
  status
FROM bookings
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
ORDER BY start_time;
