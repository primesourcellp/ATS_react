package com.example.Material_Mitra.config;

import org.springframework.context.annotation.Configuration;

import io.github.cdimascio.dotenv.Dotenv;
import jakarta.annotation.PostConstruct;

@Configuration
public class DotEnvConfig {

    private static Dotenv dotenv;

    @PostConstruct
    public void loadEnv() {
        // Load .env file from project root (Material_Mitra directory)
        try {
            dotenv = Dotenv.configure()
                    .directory("./")
                    .filename(".env")
                    .ignoreIfMissing()
                    .load();
            
            // Set system properties from .env file for Spring Boot to pick up
            dotenv.entries().forEach(entry -> {
                String key = entry.getKey();
                String value = entry.getValue();
                // Only set if not already set as system property (allows override by environment variables)
                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                }
            });
            
            System.out.println("✅ .env file loaded successfully");
        } catch (Exception e) {
            System.out.println("⚠️  .env file not found or error loading. Using system environment variables and application.properties");
        }
    }
    
    public static String get(String key) {
        if (dotenv != null) {
            return dotenv.get(key);
        }
        return System.getenv(key);
    }
    
    public static String get(String key, String defaultValue) {
        if (dotenv != null) {
            return dotenv.get(key, defaultValue);
        }
        String envValue = System.getenv(key);
        return envValue != null ? envValue : defaultValue;
    }
}

