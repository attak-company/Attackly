-- 創建跨日訂單測試資料
-- 訂單時間：從 4/30 晚上 23:00 到 5/1 凌晨 02:00（橫跨午夜）

-- 插入新客戶（如果衝突則更新）
INSERT INTO "public"."customers" (
  user_id,
  customer_name,
  phone,
  email,
  created_at,
  updated_at
) VALUES (
  '9671a408-107d-41cd-8064-b7924f8db229',
  '跨日測試客戶',
  '0912345678',
  'crossday@test.com',
  NOW(),
  NOW()
) ON CONFLICT (user_id, phone) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- 插入跨日訂單
INSERT INTO "public"."bookings" (
  id,
  user_id,
  customer_name,
  phone,
  email,
  service,
  service_type,
  service_abbr,
  start_time,
  end_time,
  date,
  duration,
  status,
  is_finished,
  is_active,
  notes,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9671a408-107d-41cd-8064-b7924f8db229',
  '跨日測試客戶',
  '0912345678',
  'crossday@test.com',
  '剪髮',
  'hair',
  '剪髮',
  '2026-04-30T23:00:00+08:00',
  '2026-05-01T02:00:00+08:00',
  '2026-04-30',
  180,
  'confirmed',
  false,
  true,
  '跨日訂單測試：從 4/30 23:00 到 5/1 02:00',
  NOW(),
  NOW()
);

-- 驗證插入結果
SELECT 
  customer_name,
  start_time,
  end_time,
  date,
  duration,
  is_finished,
  is_active,
  status,
  notes
FROM bookings
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
AND customer_name = '跨日測試客戶'
ORDER BY start_time;
