-- Test notification to verify the system is working
USE Material_Mitra;

-- Insert a test notification
INSERT INTO notifications (title, message, type, `read`, created_at) 
VALUES ('Test Notification', 'This is a test notification to verify the bell icon works', 'GENERAL', FALSE, NOW());

-- Insert another test notification
INSERT INTO notifications (title, message, type, `read`, created_at) 
VALUES ('New Website Application', 'John Doe has applied for the position: Software Developer', 'NEW_APPLICATION', FALSE, NOW());

-- Show all notifications
SELECT * FROM notifications ORDER BY created_at DESC;
