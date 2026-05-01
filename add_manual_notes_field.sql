-- 在 customers 表添加 manual_notes 欄位
-- 用於記錄店長手動添加的備註，如特殊需求、染劑過敏等

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS manual_notes TEXT;

-- 添加註釋
COMMENT ON COLUMN customers.manual_notes IS '店長手動備註：記錄客戶特殊需求（如染劑過敏、偏好等）';
