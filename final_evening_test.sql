-- 最終功能驗證與環境淨化腳本
-- 基準時間：2026-04-28 19:59 (UTC+8)
-- 目標：驗證系統已徹底遷移至以 start_time 為唯一真理來源

-- 1. 清空舊數據
DELETE FROM bookings 
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229';

-- 2. 注入校準後的測試資料（晚間三態測試）
-- 所有資料的 time 欄位設為 NULL，強制系統使用 start_time

-- 阿鐘 (已結束 - 灰色)
-- 18:30-19:30，現在 19:59 已結束
INSERT INTO bookings (
  id,
  user_id,
  category,
  service,
  service_type,
  service_abbr,
  customer_name,
  date,
  time,  -- 強制設為 NULL
  duration,
  start_time,
  end_time,
  phone,
  email,
  tags,
  source,
  status,
  is_deleted,
  is_active,
  is_finished
) VALUES (
  gen_random_uuid(),
  '9671a408-107d-41cd-8064-b7924f8db229',
  'booking',
  '美甲',
  'nail',
  '指甲',
  '阿鐘',
  '2026-04-28',
  NULL,  -- 強制設為 NULL
  60,
  '2026-04-28 18:30:00+08',
  '2026-04-28 19:30:00+08',
  '0912345678',
  NULL,
  ARRAY[]::text[],
  'manual',
  'confirmed',
  false,
  false,
  true
);

-- 廖老大 (進行中 - 紅色)
-- 19:40-20:40，現在 19:59 正在進行中
INSERT INTO bookings (
  id,
  user_id,
  category,
  service,
  service_type,
  service_abbr,
  customer_name,
  date,
  time,  -- 強制設為 NULL
  duration,
  start_time,
  end_time,
  phone,
  email,
  tags,
  source,
  status,
  is_deleted,
  is_active,
  is_finished
) VALUES (
  gen_random_uuid(),
  '9671a408-107d-41cd-8064-b7924f8db229',
  'booking',
  '美甲',
  'nail',
  '指甲',
  '廖老大',
  '2026-04-28',
  NULL,  -- 強制設為 NULL
  60,
  '2026-04-28 19:40:00+08',
  '2026-04-28 20:40:00+08',
  '0975111111',
  NULL,
  ARRAY[]::text[],
  'AI_Chatbot',
  'confirmed',
  false,
  true,
  false
);

-- 店內大掃除 (進行中活動 - 紅色)
-- 19:50-20:20，現在 19:59 正在進行中
INSERT INTO bookings (
  id,
  user_id,
  category,
  service,
  service_type,
  service_abbr,
  customer_name,
  date,
  time,  -- 強制設為 NULL
  duration,
  start_time,
  end_time,
  phone,
  email,
  tags,
  source,
  status,
  is_deleted,
  is_active,
  is_finished,
  notes
) VALUES (
  gen_random_uuid(),
  '9671a408-107d-41cd-8064-b7924f8db229',
  'activity',
  '店內大掃除',
  'other',
  '其他',
  NULL,
  '2026-04-28',
  NULL,  -- 強制設為 NULL
  30,
  '2026-04-28 19:50:00+08',
  '2026-04-28 20:20:00+08',
  NULL,
  NULL,
  ARRAY[]::text[],
  'manual',
  'confirmed',
  false,
  true,
  false,
  '店內大掃除'
);

-- 林志玲 (未來預約 - 白色)
-- 21:00-22:00，現在 19:59 尚未開始
INSERT INTO bookings (
  id,
  user_id,
  category,
  service,
  service_type,
  service_abbr,
  customer_name,
  date,
  time,  -- 強制設為 NULL
  duration,
  start_time,
  end_time,
  phone,
  email,
  tags,
  source,
  status,
  is_deleted,
  is_active,
  is_finished
) VALUES (
  gen_random_uuid(),
  '9671a408-107d-41cd-8064-b7924f8db229',
  'booking',
  '美甲',
  'nail',
  '指甲',
  '林志玲',
  '2026-04-28',
  NULL,  -- 強制設為 NULL
  60,
  '2026-04-28 21:00:00+08',
  '2026-04-28 22:00:00+08',
  '0912345678',
  NULL,
  ARRAY[]::text[],
  'manual',
  'confirmed',
  false,
  false,
  false
);

-- 驗證查詢
SELECT 
  customer_name,
  service,
  category,
  date,
  time,
  start_time,
  end_time,
  duration,
  source,
  is_active,
  is_finished
FROM bookings
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
ORDER BY start_time;
