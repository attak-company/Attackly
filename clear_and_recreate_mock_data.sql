-- 清空 2026年4月19日的模擬數據
DELETE FROM bookings WHERE date = '2026-04-19';

-- 重新創建模擬數據，確保 type 和 category 欄位同步
-- 現在是晚上8點14分，需要插入已完成的、正在進行的、未來的預約和事件

-- 已完成的預約（8:30-9:00，現在已經過去了）
INSERT INTO bookings (id, type, category, customer_name, service, service_type, service_abbr, date, time, duration, phone, email, tags, ai_notes, is_active, is_finished, user_id, booking_source) 
VALUES (
  'mock-finished-1', 
  'booking',
  'booking', 
  '已完成客戶A', 
  '指甲設計', 
  'nail', 
  '指甲', 
  '2026-04-19', 
  '20:30', 
  '30分', 
  '0912345678', 
  'customer1@example.com', 
  ARRAY['新客']::text[], 
  '', 
  false, 
  true, 
  '9671a408-107d-41cd-8064-b7924f8db229', 
  'manual'
);

-- 正在進行的預約（8:30-9:30，現在還在進行中）
INSERT INTO bookings (id, type, category, customer_name, service, service_type, service_abbr, date, time, duration, phone, email, tags, ai_notes, is_active, is_finished, user_id, booking_source) 
VALUES (
  'mock-active-1', 
  'booking',
  'booking', 
  '進行中客戶B', 
  '美睫服務', 
  'eyelash', 
  '美睫', 
  '2026-04-19', 
  '20:30', 
  '60分', 
  '0923456789', 
  'customer2@example.com', 
  ARRAY['VIP']::text[], 
  '', 
  true, 
  false, 
  '9671a408-107d-41cd-8064-b7924f8db229', 
  'manual'
);

-- 未來的預約（9:00-10:00）
INSERT INTO bookings (id, type, category, customer_name, service, service_type, service_abbr, date, time, duration, phone, email, tags, ai_notes, is_active, is_finished, user_id, booking_source) 
VALUES (
  'mock-future-1', 
  'booking',
  'booking', 
  '未來客戶C', 
  '理髮服務', 
  'hair', 
  '理髮', 
  '2026-04-19', 
  '21:00', 
  '60分', 
  '0934567890', 
  'customer3@example.com', 
  ARRAY['新客']::text[], 
  '', 
  false, 
  false, 
  '9671a408-107d-41cd-8064-b7924f8db229', 
  'manual'
);

-- 未來的事件（10:00-10:30）
INSERT INTO bookings (id, type, category, customer_name, service, service_type, service_abbr, date, time, duration, phone, email, tags, ai_notes, is_active, is_finished, user_id, booking_source) 
VALUES (
  'mock-event-1', 
  'activity',
  'activity', 
  '店內會議', 
  '店內事件', 
  'other', 
  '事件', 
  '2026-04-19', 
  '22:00', 
  '30分', 
  '', 
  '', 
  ARRAY[]::text[], 
  '每週店內會議', 
  false, 
  false, 
  '9671a408-107d-41cd-8064-b7924f8db229', 
  'manual'
);

-- 未來的預約（10:30-11:00）
INSERT INTO bookings (id, type, category, customer_name, service, service_type, service_abbr, date, time, duration, phone, email, tags, ai_notes, is_active, is_finished, user_id, booking_source) 
VALUES (
  'mock-future-2', 
  'booking',
  'booking', 
  '未來客戶D', 
  '指甲護理', 
  'nail', 
  '指甲', 
  '2026-04-19', 
  '22:30', 
  '30分', 
  '0945678901', 
  'customer4@example.com', 
  ARRAY['VIP']::text[], 
  '', 
  false, 
  false, 
  '9671a408-107d-41cd-8064-b7924f8db229', 
  'manual'
);

-- 未來的事件（11:00-11:30）
INSERT INTO bookings (id, type, category, customer_name, service, service_type, service_abbr, date, time, duration, phone, email, tags, ai_notes, is_active, is_finished, user_id, booking_source) 
VALUES (
  'mock-event-2', 
  'activity',
  'activity', 
  '庫存盤點', 
  '店內事件', 
  'other', 
  '事件', 
  '2026-04-19', 
  '23:00', 
  '30分', 
  '', 
  '', 
  ARRAY[]::text[], 
  '每週庫存盤點', 
  false, 
  false, 
  '9671a408-107d-41cd-8064-b7924f8db229', 
  'manual'
);
