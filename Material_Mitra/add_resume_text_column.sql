-- Migration script to add resume_text column for fast resume search
-- This enables database-level search instead of parsing files on-the-fly
-- Run this script on your database to enable fast resume search for 10,000+ resumes

-- Step 1: Add resume_text column to candidate table
ALTER TABLE candidate 
ADD COLUMN resume_text LONGTEXT NULL AFTER resume_path;

-- Step 2: Create FULLTEXT index for fast text search (MySQL)
-- Note: FULLTEXT index requires MyISAM or InnoDB with innodb_ft_min_token_size setting
-- For InnoDB, you may need to adjust: SET GLOBAL innodb_ft_min_token_size = 1;
CREATE FULLTEXT INDEX idx_resume_text_fulltext ON candidate(resume_text);

-- Step 3: Create regular index for faster LIKE queries (alternative to FULLTEXT)
-- This works with all MySQL storage engines
CREATE INDEX idx_resume_text ON candidate(resume_text(255));

-- Step 4: Optional - Backfill existing resumes
-- This will parse existing resume files and populate resume_text column
-- Note: This may take time depending on number of resumes
-- You can run this via a background job or manually update candidates

-- Example query to check candidates without resume_text:
-- SELECT id, name, resume_path FROM candidate WHERE resume_path IS NOT NULL AND resume_text IS NULL;

