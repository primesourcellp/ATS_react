-- Add recruiter tracking columns for reporting

ALTER TABLE candidate
    ADD COLUMN created_by_id BIGINT NULL,
    ADD COLUMN created_at DATE NULL;

ALTER TABLE job_application
    ADD COLUMN created_by_id BIGINT NULL;

ALTER TABLE interview
    ADD COLUMN scheduled_by_id BIGINT NULL,
    ADD COLUMN scheduled_on DATE NULL;

-- Optional: backfill created_at/scheduled_on using existing dates if available
UPDATE candidate SET created_at = COALESCE(created_at, updated_at);
UPDATE interview SET scheduled_on = COALESCE(scheduled_on, interview_date);

-- Foreign keys (run only if the user table is already populated and relationships are desired)
ALTER TABLE candidate
    ADD CONSTRAINT fk_candidate_created_by
        FOREIGN KEY (created_by_id) REFERENCES user(id);

ALTER TABLE job_application
    ADD CONSTRAINT fk_job_application_created_by
        FOREIGN KEY (created_by_id) REFERENCES user(id);

ALTER TABLE interview
    ADD CONSTRAINT fk_interview_scheduled_by
        FOREIGN KEY (scheduled_by_id) REFERENCES user(id);

