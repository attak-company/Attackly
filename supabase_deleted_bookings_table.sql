-- Supabase Deleted Bookings Table Schema
-- 執行此 SQL 指令在 Supabase SQL Editor 中

-- 創建 deleted_bookings 表格
CREATE TABLE IF NOT EXISTS deleted_bookings (
  id VARCHAR(36) PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  service VARCHAR(100) NOT NULL,
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('nail', 'eyelash', 'hair', 'other')),
  service_abbr VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration VARCHAR(20) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  tags TEXT[],
  ai_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  is_finished BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  booking_source VARCHAR(20) DEFAULT 'manual' CHECK (booking_source IN ('manual', 'system', 'customer'))
);

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_deleted_bookings_user_id ON deleted_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_bookings_deleted_at ON deleted_bookings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_bookings_user_deleted_at ON deleted_bookings(user_id, deleted_at);

-- 創建觸發器自動更新 deleted_at 欄位
CREATE OR REPLACE FUNCTION update_deleted_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_deleted_at
  BEFORE UPDATE ON deleted_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_deleted_at_column();

-- 啟用 Row Level Security (RLS)
ALTER TABLE deleted_bookings ENABLE ROW LEVEL SECURITY;

-- 創建 RLS 策略：用戶只能查看和刪除自己的刪除記錄
CREATE POLICY "Users can view own deleted bookings"
  ON deleted_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deleted bookings"
  ON deleted_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deleted bookings"
  ON deleted_bookings FOR DELETE
  USING (auth.uid() = user_id);

-- 創建函數：清理超過 24 小時的刪除記錄
CREATE OR REPLACE FUNCTION cleanup_old_deleted_bookings()
RETURNS void AS $$
BEGIN
  DELETE FROM deleted_bookings
  WHERE deleted_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 創建定時任務：每天凌晨 12:00 執行清理
-- 注意：這需要 Supabase Pro 計劃或使用 pg_cron 擴展
-- 如果沒有 pg_cron，可以使用 Supabase Edge Functions 來定時執行

-- 檢查是否安裝了 pg_cron 擴展
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 註冊定時任務（每天凌晨 12:00 執行）
SELECT cron.schedule(
  'cleanup-deleted-bookings',
  '0 0 * * *',
  'SELECT cleanup_old_deleted_bookings();'
);
