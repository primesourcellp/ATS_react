-- Alter candidate table status column to accommodate NEW_CANDIDATE status
ALTER TABLE candidate MODIFY COLUMN status VARCHAR(100);

