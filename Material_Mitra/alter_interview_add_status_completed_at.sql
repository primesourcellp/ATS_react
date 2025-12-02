-- Add status and completed_at columns to interview table
-- This migration adds the missing columns that are defined in the Interview entity

ALTER TABLE interview 
ADD COLUMN status VARCHAR(50) DEFAULT 'SCHEDULED' AFTER description;

ALTER TABLE interview 
ADD COLUMN completed_at DATETIME NULL AFTER status;

-- Update existing interviews to have SCHEDULED status if they don't have one
UPDATE interview 
SET status = 'SCHEDULED' 
WHERE status IS NULL;

