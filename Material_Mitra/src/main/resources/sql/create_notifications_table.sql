-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    related_entity_id BIGINT NULL,
    related_entity_type VARCHAR(100) NULL,
    INDEX idx_created_at (created_at),
    INDEX idx_read (read),
    INDEX idx_type (type),
    INDEX idx_related_entity (related_entity_id, related_entity_type)
);
