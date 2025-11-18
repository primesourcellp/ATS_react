-- Add NOT_RELEVANT status to candidate, job_application, and application_status_history tables
-- This ensures the database can accept the new NOT_RELEVANT status value

-- Update candidate table status column to VARCHAR if it's still ENUM
ALTER TABLE candidate
    MODIFY COLUMN status VARCHAR(100) NOT NULL;

-- Update job_application table status column to VARCHAR if it's still ENUM
ALTER TABLE job_application
    MODIFY COLUMN status VARCHAR(100) NOT NULL;

-- Update application_status_history table status column to VARCHAR if it's still ENUM
ALTER TABLE application_status_history
    MODIFY COLUMN status VARCHAR(100) NOT NULL;

-- Verify the changes
-- SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME = 'candidate' 
-- AND COLUMN_NAME = 'status';

