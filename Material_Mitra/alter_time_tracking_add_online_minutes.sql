-- Add columns to track ONLINE time only (exclude AWAY time)
ALTER TABLE time_tracking 
ADD COLUMN online_minutes BIGINT DEFAULT 0,
ADD COLUMN last_online_time DATETIME;

-- Update existing records: set onlineMinutes = workingMinutes (for backward compatibility)
UPDATE time_tracking 
SET online_minutes = COALESCE(working_minutes, 0)
WHERE online_minutes IS NULL;

-- Set last_online_time for active sessions
UPDATE time_tracking 
SET last_online_time = login_time
WHERE is_active = true AND last_online_time IS NULL;

