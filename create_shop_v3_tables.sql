-- ========================================
-- 建立 V3 資料表：單一店長、單一列、全資料陣列結構
-- ========================================

-- 1. 建立 shop_bookings_v3 表
CREATE TABLE IF NOT EXISTS shop_bookings_v3 (
    user_id UUID PRIMARY KEY,
    all_bookings JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 確保每個用戶只能有一筆資料
    CONSTRAINT shop_bookings_v3_user_unique UNIQUE (user_id)
);

-- 2. 建立 shop_customers_v3 表  
CREATE TABLE IF NOT EXISTS shop_customers_v3 (
    user_id UUID PRIMARY KEY,
    all_customers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 確保每個用戶只能有一筆資料
    CONSTRAINT shop_customers_v3_user_unique UNIQUE (user_id)
);

-- ========================================
-- 建立索引以提升查詢效能
-- ========================================

-- shop_bookings_v3 索引
CREATE INDEX IF NOT EXISTS idx_shop_bookings_v3_user_id ON shop_bookings_v3(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_bookings_v3_all_bookings ON shop_bookings_v3 USING GIN(all_bookings);

-- shop_customers_v3 索引  
CREATE INDEX IF NOT EXISTS idx_shop_customers_v3_user_id ON shop_customers_v3(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_customers_v3_all_customers ON shop_customers_v3 USING GIN(all_customers);

-- ========================================
-- 建立觸發器自動更新 updated_at
-- ========================================

-- shop_bookings_v3 觸發器
CREATE OR REPLACE FUNCTION update_shop_bookings_v3_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_shop_bookings_v3_updated_at
    BEFORE UPDATE ON shop_bookings_v3
    FOR EACH ROW
    EXECUTE FUNCTION update_shop_bookings_v3_updated_at();

-- shop_customers_v3 觸發器
CREATE OR REPLACE FUNCTION update_shop_customers_v3_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_shop_customers_v3_updated_at
    BEFORE UPDATE ON shop_customers_v3
    FOR EACH ROW
    EXECUTE FUNCTION update_shop_customers_v3_updated_at();

-- ========================================
-- 初始化當前用戶的資料
-- ========================================

-- 為當前用戶 (9671a408-107d-41cd-8064-b7924f8db229) 建立初始記錄
INSERT INTO shop_bookings_v3 (user_id, all_bookings)
VALUES ('9671a408-107d-41cd-8064-b7924f8db229', '[]'::jsonb)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO shop_customers_v3 (user_id, all_customers) 
VALUES ('9671a408-107d-41cd-8064-b7924f8db229', '[]'::jsonb)
ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- 資料表說明
-- ========================================

/*
shop_bookings_v3 結構：
{
    "user_id": "9671a408-107d-41cd-8064-b7924f8db229",
    "all_bookings": [
        {
            "id": "booking-uuid",
            "customer_detail": {
                "name": "客戶姓名",
                "phone": "0912345678",
                "email": "customer@example.com"
            },
            "service_content": {
                "service": "服務名稱",
                "price": 1000,
                "category": "booking"
            },
            "schedule_config": {
                "date": "2026-05-05",
                "duration": 60,
                "end_time": "14:00:00"
            },
            "admin_meta": {
                "status": "confirmed",
                "source": "web_dashboard",
                "ai_notes": "AI 備註",
                "is_deleted": false,
                "is_active": true,
                "is_finished": false
            },
            "start_time": "13:00:00",
            "created_at": "2026-05-05T05:00:00Z"
        }
    ],
    "created_at": "2026-05-05T05:00:00Z",
    "updated_at": "2026-05-05T05:00:00Z"
}

shop_customers_v3 結構：
{
    "user_id": "9671a408-107d-41cd-8064-b7924f8db229",
    "all_customers": [
        {
            "id": "customer-uuid",
            "basic_info": {
                "name": "客戶姓名",
                "phone": "0912345678",
                "email": "customer@example.com"
            },
            "spending_stats": {
                "total_bookings": 5,
                "total_spending": 5000,
                "no_show_count": 1,
                "is_blacklisted": false
            },
            "marketing_data": {
                "tags": ["VIP", "老客戶"],
                "manual_notes": "客戶備註",
                "last_contact_at": "2026-05-05T05:00:00Z"
            },
            "created_at": "2026-05-05T05:00:00Z",
            "updated_at": "2026-05-05T05:00:00Z"
        }
    ],
    "created_at": "2026-05-05T05:00:00Z",
    "updated_at": "2026-05-05T05:00:00Z"
}
*/
