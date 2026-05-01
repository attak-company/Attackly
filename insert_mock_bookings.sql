-- 插入 10 筆模擬預約訂單用於測試
-- 使用動態獲取當前登入用戶的 ID

-- 先獲取當前用戶 ID（如果已登入）
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- 嘗試從 auth.users 獲取當前用戶 ID
    -- 注意：這需要在已登入狀態下執行
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    IF current_user_id IS NOT NULL THEN
        -- 插入 10 筆模擬預約
        INSERT INTO bookings (id, user_id, category, customer_name, service, service_type, service_abbr, date, time, duration, phone, email, tags, ai_notes, status, is_deleted, customer_id) VALUES
        ('1001', current_user_id, 'booking', '林小美', '美甲保養', 'nail', '指甲', '2026-04-27', '14:00', 90, '0912345678', 'lin@example.com', ARRAY['新客'], '', 'pending', false, NULL),
        ('1002', current_user_id, 'booking', '陳大文', '足部修整', 'other', '其他', '2026-04-27', '16:00', 60, '0923456789', 'chen@example.com', ARRAY['VIP'], '', 'pending', false, NULL),
        ('1003', current_user_id, 'booking', '張思思', '深層SPA', 'other', '其他', '2026-04-27', '18:00', 120, '0934567890', 'zhang@example.com', ARRAY['新客'], '', 'confirmed', false, NULL),
        ('1004', current_user_id, 'booking', '王美玲', '美睫造型', 'eyelash', '美睫', '2026-04-28', '10:00', 90, '0945678901', 'wang@example.com', ARRAY['VIP'], '', 'confirmed', false, NULL),
        ('1005', current_user_id, 'booking', '李建國', '男士護理', 'hair', '理髮', '2026-04-28', '14:00', 45, '0956789012', 'li@example.com', ARRAY['新客'], '', 'pending', false, NULL),
        ('1006', current_user_id, 'booking', '黃雅婷', '美甲保養', 'nail', '指甲', '2026-04-28', '15:30', 90, '0967890123', 'huang@example.com', ARRAY['VIP'], '', 'confirmed', false, NULL),
        ('1007', current_user_id, 'booking', '林志豪', '足部修整', 'other', '其他', '2026-04-29', '11:00', 60, '0978901234', 'lin2@example.com', ARRAY['新客'], '', 'pending', false, NULL),
        ('1008', current_user_id, 'booking', '陳怡君', '深層SPA', 'other', '其他', '2026-04-29', '13:00', 120, '0989012345', 'chen2@example.com', ARRAY['VIP'], '', 'confirmed', false, NULL),
        ('1009', current_user_id, 'booking', '張家豪', '美睫造型', 'eyelash', '美睫', '2026-04-30', '09:00', 90, '0990123456', 'zhang2@example.com', ARRAY['新客'], '', 'pending', false, NULL),
        ('1010', current_user_id, 'booking', '王淑芬', '男士護理', 'hair', '理髮', '2026-04-30', '16:00', 45, '0912345670', 'wang2@example.com', ARRAY['VIP'], '', 'confirmed', false, NULL);
        
        RAISE NOTICE '成功插入 10 筆模擬預約';
    ELSE
        RAISE NOTICE '未找到用戶，請先登入或手動替換 user_id';
    END IF;
END $$;

-- 驗證插入結果
SELECT * FROM bookings WHERE id IN ('1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008', '1009', '1010');
