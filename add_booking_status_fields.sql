-- 添加 status 和 end_time 欄位到 bookings 表
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- 清理不符合約束的數據，將所有非預期的 status 值設為 'scheduled'
UPDATE bookings SET status = 'scheduled' WHERE status NOT IN ('scheduled', 'completed', 'no_show', 'cancelled');

-- 添加約束限制 status 欄位的值
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_booking_status;
ALTER TABLE bookings ADD CONSTRAINT check_booking_status 
  CHECK (status IN ('scheduled', 'completed', 'no_show', 'cancelled'));

-- 為 status 欄位創建索引
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
