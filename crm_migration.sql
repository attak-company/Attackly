-- CRM 導向資料庫遷移腳本
-- 目標：將系統從「預約導向」轉向「CRM 導向」
-- 整合 blacklist、customer_booking_history、deleted_bookings 到核心表

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

    -- 添加 blacklist_reason 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'blacklist_reason'
    ) THEN
        ALTER TABLE customers ADD COLUMN blacklist_reason TEXT;
    END IF;

    -- 添加唯一約束（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'customers'::regclass 
        AND conname = 'customers_user_id_phone_key'
    ) THEN
        ALTER TABLE customers 
        ADD CONSTRAINT customers_user_id_phone_key 
        UNIQUE (user_id, phone);
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

    -- 添加 status 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'status'
    ) THEN
        ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    -- 更新所有不符合約束的 status 值為 'pending'
    UPDATE bookings 
    SET status = 'pending' 
    WHERE status IS NULL 
       OR status NOT IN ('pending', 'confirmed', 'completed', 'cancelled');

    -- 刪除舊的 status 約束（如果存在）
    DO $$
    BEGIN
        -- 嘗試刪除可能存在的舊約束
        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_status;
        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_booking_status;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE '約束不存在或刪除失敗，繼續執行';
    END $$;

    -- 添加約束確保 status 只能是特定值
    ALTER TABLE bookings 
    ADD CONSTRAINT chk_status 
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));

    -- 添加 is_deleted 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE bookings ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
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

-- 5.1 創建觸發器：在軟刪除預約時減少顧客的預約次數
CREATE OR REPLACE FUNCTION soft_delete_booking_from_customer()
RETURNS TRIGGER AS $$
BEGIN
    -- 當 is_deleted 從 false 變為 true 時，減少預約次數
    IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
        IF NEW.customer_id IS NOT NULL THEN
            UPDATE customers
            SET total_bookings = GREATEST(total_bookings - 1, 0),
                updated_at = NOW()
            WHERE id = NEW.customer_id;
        END IF;
    END IF;
    
    -- 當 is_deleted 從 true 變為 false（恢復）時，增加預約次數
    IF OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
        IF NEW.customer_id IS NOT NULL THEN
            UPDATE customers
            SET total_bookings = total_bookings + 1,
                updated_at = NOW()
            WHERE id = NEW.customer_id;
        END IF;
    END IF;
    
    RETURN NEW;
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

-- 應用軟刪除觸發器
DROP TRIGGER IF EXISTS trg_soft_delete_booking_from_customer ON bookings;
CREATE TRIGGER trg_soft_delete_booking_from_customer
    AFTER UPDATE OF is_deleted ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION soft_delete_booking_from_customer();

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

-- 9. 資料遷移：將 customer_booking_history 數據搬移到 bookings 表
-- 注意：這部分需要根據實際的 customer_booking_history 表結構調整
DO $$
BEGIN
    -- 檢查 customer_booking_history 表是否存在
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_booking_history') THEN
        -- 將 customer_booking_history 的數據插入到 bookings，設為 completed 狀態
        INSERT INTO bookings (
            user_id,
            customer_name,
            phone,
            email,
            service,
            service_type,
            service_abbr,
            date,
            time,
            duration,
            status,
            tags,
            category
        )
        SELECT 
            user_id,
            customer_name,
            phone,
            email,
            service,
            service_type,
            service_abbr,
            date,
            time,
            duration,
            'completed' AS status,
            tags,
            'booking' AS category
        FROM customer_booking_history
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '已遷移 customer_booking_history 數據到 bookings 表';
    ELSE
        RAISE NOTICE 'customer_booking_history 表不存在，跳過遷移';
    END IF;
END $$;

-- 10. 資料遷移：將 deleted_bookings 數據搬移到 bookings 表
DO $$
BEGIN
    -- 檢查 deleted_bookings 表是否存在
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deleted_bookings') THEN
        -- 將 deleted_bookings 的數據插入到 bookings，設為 cancelled 狀態和 is_deleted = true
        INSERT INTO bookings (
            user_id,
            customer_name,
            phone,
            email,
            service,
            service_type,
            service_abbr,
            date,
            time,
            duration,
            status,
            is_deleted,
            tags,
            category
        )
        SELECT 
            user_id,
            customer_name,
            phone,
            email,
            service,
            service_type,
            service_abbr,
            date,
            time,
            duration,
            'cancelled' AS status,
            TRUE AS is_deleted,
            tags,
            'booking' AS category
        FROM deleted_bookings
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '已遷移 deleted_bookings 數據到 bookings 表';
    ELSE
        RAISE NOTICE 'deleted_bookings 表不存在，跳過遷移';
    END IF;
END $$;

-- 11. 資料遷移：將 blacklist 數據同步到 customers 表
DO $$
BEGIN
    -- 檢查 blacklist 表是否存在
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blacklist') THEN
        -- 根據 blacklist 表更新 customers 的 is_blacklisted 和 blacklist_reason
        UPDATE customers c
        SET 
            is_blacklisted = TRUE,
            blacklist_reason = b.reason
        FROM blacklist b
        WHERE c.phone = REGEXP_REPLACE(b.phone, '[^0-9]', '', 'g')
           OR c.email = b.email;
        
        RAISE NOTICE '已同步 blacklist 數據到 customers 表';
    ELSE
        RAISE NOTICE 'blacklist 表不存在，跳過遷移';
    END IF;
END $$;

-- 12. 為 status 和 is_deleted 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_is_deleted ON bookings(is_deleted);
CREATE INDEX IF NOT EXISTS idx_customers_is_blacklisted ON customers(is_blacklisted);

-- 13. 清理 bookings 表中的重複 id（為添加主鍵做準備）
DO $$
DECLARE
    duplicate_ids RECORD;
BEGIN
    -- 刪除重複的記錄，保留最新的（created_at 最晚的）
    FOR duplicate_ids IN 
        SELECT id, MIN(ctid) as keep_ctid
        FROM bookings
        GROUP BY id
        HAVING COUNT(*) > 1
    LOOP
        DELETE FROM bookings 
        WHERE id = duplicate_ids.id 
        AND ctid != duplicate_ids.keep_ctid;
        RAISE NOTICE '已刪除重複 id: %', duplicate_ids.id;
    END LOOP;
END $$;

-- 14. 為 bookings 表添加主鍵
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'bookings' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE bookings ADD PRIMARY KEY (id);
        RAISE NOTICE '已為 bookings 表添加主鍵';
    END IF;
END $$;

-- 15. 為 customers 表添加主鍵
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'customers' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        ALTER TABLE customers ADD PRIMARY KEY (id);
        RAISE NOTICE '已為 customers 表添加主鍵';
    END IF;
END $$;

