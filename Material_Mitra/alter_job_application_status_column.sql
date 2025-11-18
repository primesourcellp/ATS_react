-- Ensure job_application.status can store all ResultStatus enum values
-- This mirrors the candidate status column update.

ALTER TABLE job_application
    MODIFY COLUMN status VARCHAR(100) NOT NULL;

-- If you prefer to keep it as an ENUM, replace the statement above with the
-- explicit list of statuses from ResultStatus.java.

