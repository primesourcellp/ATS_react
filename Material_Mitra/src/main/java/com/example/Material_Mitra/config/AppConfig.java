package com.example.Material_Mitra.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.example.Material_Mitra.dto.DTOMapper;

import jakarta.annotation.PostConstruct;

@Configuration
public class AppConfig {

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @PostConstruct
    public void init() {
        // Initialize DTOMapper with base URL from application.properties
        DTOMapper.setBaseUrl(baseUrl);
        System.out.println("✅ DTOMapper base URL initialized: " + baseUrl);
    }
}

