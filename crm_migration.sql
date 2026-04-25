-- CRM 導向資料庫遷移腳本
-- 目標：將系統從「預約導向」轉向「CRM 導向」

-- 1. 添加 is_blacklisted 和 total_spending 到 customers 表
DO $$
BEGIN
    -- 添加 is_blacklisted 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'is_blacklisted'
    ) THEN
        ALTER TABLE customers ADD COLUMN is_blacklisted BOOLEAN DEFAULT FALSE;
    END IF;

    -- 添加 total_spending 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'total_spending'
    ) THEN
        ALTER TABLE customers ADD COLUMN total_spending NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 2. 添加 customer_id 外鍵到 bookings 表
DO $$
BEGIN
    -- 添加 customer_id 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN customer_id UUID;
        
        -- 添加外鍵約束
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_customer 
        FOREIGN KEY (customer_id) 
        REFERENCES customers(id) 
        ON DELETE SET NULL;
        
        -- 創建索引以提升查詢效能
        CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
    END IF;
END $$;

-- 3. 創建函數：根據電話號碼查找或創建顧客
CREATE OR REPLACE FUNCTION get_or_create_customer(
    p_user_id UUID,
    p_phone VARCHAR(20),
    p_customer_name VARCHAR(255),
    p_email VARCHAR(255) DEFAULT NULL,
    p_tags TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID AS $$
DECLARE
    v_customer_id UUID;
    v_merged_tags TEXT[];
BEGIN
    -- 標準化電話號碼（移除所有非數字字符）
    p_phone := REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
    
    -- 嘗試查找現有顧客
    SELECT id INTO v_customer_id
    FROM customers
    WHERE user_id = p_user_id AND phone = p_phone
    LIMIT 1;
    
    IF v_customer_id IS NOT NULL THEN
        -- 顧客已存在，合併標籤
        SELECT ARRAY(
            SELECT DISTINCT unnest(tags || p_tags)
        ) INTO v_merged_tags
        FROM customers
        WHERE id = v_customer_id;
        
        -- 更新顧客資料（合併標籤，更新姓名和電子信箱）
        UPDATE customers
        SET 
            customer_name = COALESCE(p_customer_name, customer_name),
            email = COALESCE(p_email, email),
            tags = v_merged_tags,
            updated_at = NOW()
        WHERE id = v_customer_id;
        
        RETURN v_customer_id;
    ELSE
        -- 顧客不存在，創建新顧客
        INSERT INTO customers (
            user_id, 
            phone, 
            email, 
            customer_name, 
            tags,
            total_bookings,
            is_blacklisted,
            total_spending
        )
        VALUES (
            p_user_id,
            p_phone,
            p_email,
            p_customer_name,
            p_tags,
            0,
            FALSE,
            0
        )
        RETURNING id INTO v_customer_id;
        
        RETURN v_customer_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. 創建觸發器：在新增預約時自動關聯顧客
CREATE OR REPLACE FUNCTION link_booking_to_customer()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_id UUID;
    v_phone VARCHAR(20);
BEGIN
    -- 從預約中提取電話號碼
    v_phone := REGEXP_REPLACE(NEW.phone, '[^0-9]', '', 'g');
    
    -- 如果有電話號碼，查找或創建顧客
    IF v_phone IS NOT NULL AND v_phone != '' THEN
        SELECT get_or_create_customer(
            NEW.user_id,
            v_phone,
            NEW.customer_name,
            NEW.email,
            NEW.tags
        ) INTO v_customer_id;
        
        -- 關聯預約到顧客
        NEW.customer_id := v_customer_id;
        
        -- 增加顧客的預約次數
        UPDATE customers
        SET total_bookings = total_bookings + 1,
            updated_at = NOW()
        WHERE id = v_customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 創建觸發器：在刪除預約時減少顧客的預約次數
CREATE OR REPLACE FUNCTION unlink_booking_from_customer()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.customer_id IS NOT NULL THEN
        UPDATE customers
        SET total_bookings = GREATEST(total_bookings - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.customer_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 6. 應用觸發器
DROP TRIGGER IF EXISTS trg_link_booking_to_customer ON bookings;
CREATE TRIGGER trg_link_booking_to_customer
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION link_booking_to_customer();

DROP TRIGGER IF EXISTS trg_unlink_booking_from_customer ON bookings;
CREATE TRIGGER trg_unlink_booking_from_customer
    AFTER DELETE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION unlink_booking_from_customer();

-- 7. 創建函數：標記顧客為黑名單
CREATE OR REPLACE FUNCTION mark_customer_as_blacklisted(
    p_user_id UUID,
    p_phone VARCHAR(20),
    p_reason VARCHAR(255) DEFAULT 'no_show'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_customer_id UUID;
BEGIN
    -- 標準化電話號碼
    p_phone := REGEXP_REPLACE(p_phone, '[^0-9]', '', 'g');
    
    -- 查找顧客
    SELECT id INTO v_customer_id
    FROM customers
    WHERE user_id = p_user_id AND phone = p_phone
    LIMIT 1;
    
    IF v_customer_id IS NOT NULL THEN
        -- 更新顧客黑名單狀態
        UPDATE customers
        SET 
            is_blacklisted = TRUE,
            no_show_count = no_show_count + 1,
            tags = ARRAY(
                SELECT DISTINCT unnest(tags || ARRAY['黑名單'])
            ),
            updated_at = NOW()
        WHERE id = v_customer_id;
        
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. 創建視圖：顧客預約歷史
CREATE OR REPLACE VIEW customer_booking_history AS
SELECT 
    c.id AS customer_id,
    c.user_id,
    c.phone,
    c.customer_name,
    c.email,
    c.tags,
    c.total_bookings,
    c.no_show_count,
    c.is_blacklisted,
    c.total_spending,
    c.created_at AS customer_created_at,
    b.id AS booking_id,
    b.category,
    b.service,
    b.service_type,
    b.service_abbr,
    b.date,
    b.time,
    b.duration,
    b.status,
    b.created_at AS booking_created_at
FROM customers c
LEFT JOIN bookings b ON c.id = b.customer_id
ORDER BY c.created_at DESC, b.date DESC, b.time DESC;
