-- 創建黑名單資料表
CREATE TABLE IF NOT EXISTS blacklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  reason TEXT DEFAULT 'no_show',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_blacklist_user_id ON blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_blacklist_phone ON blacklist(phone);
CREATE INDEX IF NOT EXISTS idx_blacklist_email ON blacklist(email);

-- 啟用 Row Level Security (RLS)
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- 允許已認證用戶讀取自己的黑名單
CREATE POLICY "Users can view their own blacklist"
  ON blacklist FOR SELECT
  USING (auth.uid() = user_id);

-- 允許已認證用戶插入自己的黑名單
CREATE POLICY "Users can insert their own blacklist"
  ON blacklist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 允許已認證用戶更新自己的黑名單
CREATE POLICY "Users can update their own blacklist"
  ON blacklist FOR UPDATE
  USING (auth.uid() = user_id);

-- 允許已認證用戶刪除自己的黑名單
CREATE POLICY "Users can delete their own blacklist"
  ON blacklist FOR DELETE
  USING (auth.uid() = user_id);
