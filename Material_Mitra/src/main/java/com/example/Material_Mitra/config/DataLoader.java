package com.example.Material_Mitra.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        createNotificationsTable();
    }

    private void createNotificationsTable() {
        try {
            String createTableSQL = """
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
                    INDEX idx_read (`read`),
                    INDEX idx_type (type),
                    INDEX idx_related_entity (related_entity_id, related_entity_type)
                )
                """;
            
            jdbcTemplate.execute(createTableSQL);
            System.out.println("✅ Notifications table created successfully!");
            
        } catch (Exception e) {
            System.err.println("❌ Error creating notifications table: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
