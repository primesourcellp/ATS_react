-- Alter candidate table to increase column sizes for 'about' and 'skills' fields
-- This fixes the "Data too long for column" error when storing resume parsed data

-- Change 'about' column from VARCHAR(255) to TEXT
ALTER TABLE candidate MODIFY COLUMN about TEXT;

-- Change 'skills' column from VARCHAR(255) to TEXT (if it exists and is too small)
ALTER TABLE candidate MODIFY COLUMN skills TEXT;

-- Verify the changes
-- DESCRIBE candidate;

