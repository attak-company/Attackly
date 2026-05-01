-- 設定 bookings 表 user_id 欄位的默認值為 auth.uid()
-- 這是一勞永逸的方法，確保即使程式碼漏寫 user_id，資料庫也會自動填入當前登入者的 ID

-- 修改 user_id 欄位，設置默認值為 auth.uid()
ALTER TABLE bookings 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 驗證修改結果
SELECT 
  column_name, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name = 'user_id';
