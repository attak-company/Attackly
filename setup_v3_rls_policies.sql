-- ========================================
-- V3 表格 RLS 政策設置
-- 解決 Row Level Security 權限問題
-- ========================================

-- 1. 啟用 RLS (如果尚未啟用)
ALTER TABLE shop_bookings_v3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_customers_v3 ENABLE ROW LEVEL SECURITY;

-- 2. 刪除現有政策 (如果存在)
DROP POLICY IF EXISTS "Users can view own shop_bookings_v3" ON shop_bookings_v3;
DROP POLICY IF EXISTS "Users can insert own shop_bookings_v3" ON shop_bookings_v3;
DROP POLICY IF EXISTS "Users can update own shop_bookings_v3" ON shop_bookings_v3;
DROP POLICY IF EXISTS "Users can delete own shop_bookings_v3" ON shop_bookings_v3;

DROP POLICY IF EXISTS "Users can view own shop_customers_v3" ON shop_customers_v3;
DROP POLICY IF EXISTS "Users can insert own shop_customers_v3" ON shop_customers_v3;
DROP POLICY IF EXISTS "Users can update own shop_customers_v3" ON shop_customers_v3;
DROP POLICY IF EXISTS "Users can delete own shop_customers_v3" ON shop_customers_v3;

-- 3. 創建 shop_bookings_v3 的 RLS 政策
-- 查看權限
CREATE POLICY "Users can view own shop_bookings_v3" ON shop_bookings_v3
    FOR SELECT USING (auth.uid() = user_id);

-- 插入權限
CREATE POLICY "Users can insert own shop_bookings_v3" ON shop_bookings_v3
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 更新權限
CREATE POLICY "Users can update own shop_bookings_v3" ON shop_bookings_v3
    FOR UPDATE USING (auth.uid() = user_id);

-- 刪除權限
CREATE POLICY "Users can delete own shop_bookings_v3" ON shop_bookings_v3
    FOR DELETE USING (auth.uid() = user_id);

-- 4. 創建 shop_customers_v3 的 RLS 政策
-- 查看權限
CREATE POLICY "Users can view own shop_customers_v3" ON shop_customers_v3
    FOR SELECT USING (auth.uid() = user_id);

-- 插入權限
CREATE POLICY "Users can insert own shop_customers_v3" ON shop_customers_v3
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 更新權限
CREATE POLICY "Users can update own shop_customers_v3" ON shop_customers_v3
    FOR UPDATE USING (auth.uid() = user_id);

-- 刪除權限
CREATE POLICY "Users can delete own shop_customers_v3" ON shop_customers_v3
    FOR DELETE USING (auth.uid() = user_id);

-- 5. 確認政策設置
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('shop_bookings_v3', 'shop_customers_v3')
ORDER BY tablename, policyname;
