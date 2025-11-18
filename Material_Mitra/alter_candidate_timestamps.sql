-- Update candidate timestamp columns to store time information.
ALTER TABLE candidate
    MODIFY COLUMN created_at DATETIME NULL,
    MODIFY COLUMN updated_at DATETIME NULL;

