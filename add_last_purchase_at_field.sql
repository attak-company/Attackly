-- 添加 last_purchase_at 欄位到 customers 表
-- 在 Supabase SQL Editor 中執行此腳本

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_purchase_at TIMESTAMP WITH TIME ZONE;

-- 創建觸發器：當有新的 completed 訂單時，更新客戶的 last_purchase_at
CREATE OR REPLACE FUNCTION update_last_purchase_at()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新客戶的最後消費時間
  UPDATE customers 
  SET last_purchase_at = NEW.date::timestamp with time zone
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器：在插入新的 completed 訂單時觸發
DROP TRIGGER IF EXISTS trigger_update_last_purchase_at ON bookings;
CREATE TRIGGER trigger_update_last_purchase_at
AFTER INSERT ON bookings
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION update_last_purchase_at();

-- 創建觸發器：在更新訂單狀態為 completed 時觸發
DROP TRIGGER IF EXISTS trigger_update_last_purchase_at_update ON bookings;
CREATE TRIGGER trigger_update_last_purchase_at_update
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
EXECUTE FUNCTION update_last_purchase_at();

-- 初始化現有資料：為所有有 completed 訂單的客戶設定 last_purchase_at
UPDATE customers 
SET last_purchase_at = sub.latest_date
FROM (
  SELECT 
    c.id,
    MAX(b.date::timestamp with time zone) as latest_date
  FROM customers c
  LEFT JOIN bookings b ON c.phone = b.phone AND b.user_id = c.user_id AND b.status = 'completed' AND b.is_deleted = false
  WHERE c.user_id = '9671a408-107d-41cd-8064-b7924f8db229' -- 替換為實際的 user_id
  GROUP BY c.id
) sub
WHERE customers.id = sub.id AND sub.latest_date IS NOT NULL;

-- 確認欄位已添加並檢查資料
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'last_purchase_at';

-- 檢查更新結果
SELECT customer_name, phone, last_purchase_at 
FROM customers 
WHERE user_id = '9671a408-107d-41cd-8064-b7924f8db229' -- 替換為實際的 user_id
ORDER BY last_purchase_at DESC NULLS LAST;
