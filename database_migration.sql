-- 新增 ai_settings 欄位到 users 表（如果不存在）
-- 在 Supabase SQL Editor 中執行此腳本

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{"tone": "friendly", "rules": []}'::jsonb;

-- 確認欄位已添加
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'ai_settings';
