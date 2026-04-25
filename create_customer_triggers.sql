-- 創建觸發器自動更新 customers 表的統計欄位
-- 在 Supabase SQL Editor 中執行此腳本

-- 函數：新增預約時增加 total_bookings
CREATE OR REPLACE FUNCTION increment_total_bookings()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果有 customer_id，更新該客戶的 total_bookings
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers 
    SET total_bookings = total_bookings + 1,
        updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  
  -- 如果沒有 customer_id 但有電話號碼，嘗試找到對應的客戶
  IF NEW.customer_id IS NULL AND NEW.phone IS NOT NULL THEN
    UPDATE customers 
    SET total_bookings = total_bookings + 1,
        updated_at = NOW()
    WHERE user_id = NEW.user_id AND phone = NEW.phone;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 函數：客戶未到時增加 no_show_count
CREATE OR REPLACE FUNCTION increment_no_show_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 當狀態變為 no_show 時
  IF NEW.status = 'no_show' AND (OLD.status IS NULL OR OLD.status != 'no_show') THEN
    -- 如果有 customer_id，更新該客戶的 no_show_count
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customers 
      SET no_show_count = no_show_count + 1,
          updated_at = NOW()
      WHERE id = NEW.customer_id;
    END IF;
    
    -- 如果沒有 customer_id 但有電話號碼，嘗試找到對應的客戶
    IF NEW.customer_id IS NULL AND NEW.phone IS NOT NULL THEN
      UPDATE customers 
      SET no_show_count = no_show_count + 1,
          updated_at = NOW()
      WHERE user_id = NEW.user_id AND phone = NEW.phone;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器：在插入 bookings 時執行
DROP TRIGGER IF EXISTS trigger_increment_total_bookings ON bookings;
CREATE TRIGGER trigger_increment_total_bookings
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION increment_total_bookings();

-- 創建觸發器：在更新 bookings 時執行
DROP TRIGGER IF EXISTS trigger_increment_no_show_count ON bookings;
CREATE TRIGGER trigger_increment_no_show_count
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION increment_no_show_count();

-- 確認觸發器已創建
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_increment_%';
