-- Rename existing status values to match the updated ResultStatus enum.
-- Run this after deploying the backend changes.

UPDATE candidate
SET status = 'SUBMITTED_TO_CLIENT'
WHERE status = 'SUBMITTED_BY_CLIENT';

UPDATE job_application
SET status = 'SUBMITTED_TO_CLIENT'
WHERE status = 'SUBMITTED_BY_CLIENT';

