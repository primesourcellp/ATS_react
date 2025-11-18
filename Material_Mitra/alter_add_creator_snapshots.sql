-- Add snapshot columns to preserve recruiter details even if the user record is removed
ALTER TABLE candidate
    ADD COLUMN created_by_user_id BIGINT NULL,
    ADD COLUMN created_by_name VARCHAR(150) NULL,
    ADD COLUMN created_by_email VARCHAR(200) NULL;

ALTER TABLE job_application
    ADD COLUMN created_by_user_id BIGINT NULL,
    ADD COLUMN created_by_name VARCHAR(150) NULL,
    ADD COLUMN created_by_email VARCHAR(200) NULL;

ALTER TABLE interview
    ADD COLUMN scheduled_by_user_id BIGINT NULL,
    ADD COLUMN scheduled_by_name VARCHAR(150) NULL,
    ADD COLUMN scheduled_by_email VARCHAR(200) NULL;

-- Backfill newly added columns from existing foreign-key relations
UPDATE candidate c
LEFT JOIN user u ON c.created_by_id = u.id
SET
    c.created_by_user_id = u.id,
    c.created_by_name = COALESCE(c.created_by_name, u.username),
    c.created_by_email = COALESCE(c.created_by_email, u.email)
WHERE c.created_by_id IS NOT NULL;

UPDATE job_application ja
LEFT JOIN user u ON ja.created_by_id = u.id
SET
    ja.created_by_user_id = u.id,
    ja.created_by_name = COALESCE(ja.created_by_name, u.username),
    ja.created_by_email = COALESCE(ja.created_by_email, u.email)
WHERE ja.created_by_id IS NOT NULL;

UPDATE interview i
LEFT JOIN user u ON i.scheduled_by_id = u.id
SET
    i.scheduled_by_user_id = u.id,
    i.scheduled_by_name = COALESCE(i.scheduled_by_name, u.username),
    i.scheduled_by_email = COALESCE(i.scheduled_by_email, u.email)
WHERE i.scheduled_by_id IS NOT NULL;

