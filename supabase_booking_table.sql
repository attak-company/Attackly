-- 修改 id 欄位類型為 VARCHAR 以支援數字 ID
ALTER TABLE bookings ALTER COLUMN id TYPE VARCHAR(36);

-- 將 type 欄位改為 category 欄位（如果 category 欄位不存在）
DO $$
BEGIN
    -- 檢查 category 欄位是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings' AND column_name = 'category'
    ) THEN
        -- 如果 category 不存在，檢查 type 是否存在
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'bookings' AND column_name = 'type'
        ) THEN
            -- 刪除舊的約束
            ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_type;

            -- 將 type 欄位改為 category
            ALTER TABLE bookings RENAME COLUMN type TO category;

            -- 更新現有數據：'service' -> 'booking', 'internal' -> 'activity'
            UPDATE bookings SET category = 'booking' WHERE category = 'service';
            UPDATE bookings SET category = 'activity' WHERE category = 'internal';
        END IF;

        -- 添加 category 欄位（如果不存在）
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'booking';

        -- 清理不符合約束的數據（將其他值設為默認值）
        UPDATE bookings SET category = 'booking' WHERE category NOT IN ('booking', 'activity');

        -- 更新約束為新的值
        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_category;
        ALTER TABLE bookings ADD CONSTRAINT check_category CHECK (category IN ('booking', 'activity'));

        -- 設置默認值
        ALTER TABLE bookings ALTER COLUMN category SET DEFAULT 'booking';
    ELSE
        -- category 欄位已存在，先清理不符合約束的數據
        UPDATE bookings SET category = 'booking' WHERE category NOT IN ('booking', 'activity');

        -- 更新現有數據：'service' -> 'booking', 'internal' -> 'activity'
        UPDATE bookings SET category = 'booking' WHERE category = 'service';
        UPDATE bookings SET category = 'activity' WHERE category = 'internal';

        -- 檢查並更新約束
        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_category;
        ALTER TABLE bookings ADD CONSTRAINT check_category CHECK (category IN ('booking', 'activity'));

        -- 設置默認值
        ALTER TABLE bookings ALTER COLUMN category SET DEFAULT 'booking';
    END IF;
END $$;

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(date, time);

-- 創建觸發器自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 啟用 Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 允許已認證用戶讀取自己的預約
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

-- 允許已認證用戶插入自己的預約
CREATE POLICY "Users can insert their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 允許已認證用戶更新自己的預約
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- 允許已認證用戶刪除自己的預約
CREATE POLICY "Users can delete their own bookings"
  ON bookings FOR DELETE
  USING (auth.uid() = user_id);

-- 如果需要，可以添加管理員政策（允許管理員查看所有預約）
-- 取消註釋以下代碼以啟用管理員權限
/*
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@yourdomain.com'  -- 替換為管理員 email
    )
  );
*/
