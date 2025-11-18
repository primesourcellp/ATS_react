-- Update the user.role column to support new role values such as SECONDARY_ADMIN.
-- Switches the column to VARCHAR to avoid future enum updates.

ALTER TABLE user
    MODIFY COLUMN role VARCHAR(50) NOT NULL;


