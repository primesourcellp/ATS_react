-- Create application_status_history table
CREATE TABLE IF NOT EXISTS application_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    status VARCHAR(100) NOT NULL,
    description TEXT,
    changed_by_id BIGINT,
    changed_by_user_id BIGINT,
    changed_by_name VARCHAR(150),
    changed_by_email VARCHAR(200),
    changed_at DATETIME NOT NULL,
    FOREIGN KEY (application_id) REFERENCES job_application(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_id) REFERENCES user(id) ON DELETE SET NULL,
    INDEX idx_application_id (application_id),
    INDEX idx_changed_at (changed_at)
);

