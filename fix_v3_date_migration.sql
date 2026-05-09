-- ========================================
-- 修正 V3 遷移日期欄位問題
-- 將日期從 schedule.date 複製到頂層 date 欄位
-- ========================================

-- 更新 shop_bookings_v3 表中的所有預約物件
-- 為每個預約添加頂層 date 欄位
UPDATE shop_bookings_v3 
SET all_bookings = (
    SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'id', elem->>'id',
            'customer_name', elem->>'customer_name',
            'customer_phone', elem->>'customer_phone',
            'customer_email', elem->>'customer_email',
            'date', COALESCE(elem->'schedule'->>'date', elem->>'date', ''),  -- 從 schedule.date 或頂層 date 獲取
            'service_info', elem->'service_info',
            'schedule', elem->'schedule',
            'status', elem->>'status',
            'admin_meta', elem->'admin_meta'
        ) ORDER BY (elem->>'id')
    )
    FROM jsonb_array_elements(all_bookings) AS elem
    WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
)
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229';

-- 驗證修正結果
DO $$
DECLARE
    booking_count INTEGER;
    sample_date TEXT;
BEGIN
    SELECT JSONB_ARRAY_LENGTH(all_bookings::jsonb) INTO booking_count
    FROM shop_bookings_v3 
    WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229';
    
    SELECT (all_bookings::jsonb->0->>'date') INTO sample_date
    FROM shop_bookings_v3 
    WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229'
    AND JSONB_ARRAY_LENGTH(all_bookings::jsonb) > 0;
    
    RAISE NOTICE '=== V3 日期修正完成 ===';
    RAISE NOTICE '預約總筆數: %', booking_count;
    RAISE NOTICE '第一筆預約日期範例: %', sample_date;
    RAISE NOTICE '修正完成時間: %', NOW();
END $$;
