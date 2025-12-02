package com.example.Material_Mitra.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Material_Mitra.service.ChatbotService;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping("/message")
    public ResponseEntity<Map<String, String>> sendMessage(@RequestBody Map<String, String> request) {
        try {
            String userMessage = request.get("message");
            if (userMessage == null || userMessage.trim().isEmpty()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Message cannot be empty");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            System.out.println("Received chatbot message: " + userMessage);
            String response = chatbotService.processMessage(userMessage);
            System.out.println("Chatbot response generated successfully");

            Map<String, String> responseMap = new HashMap<>();
            responseMap.put("response", response);
            responseMap.put("message", response); // For backward compatibility

            return ResponseEntity.ok(responseMap);
        } catch (Exception e) {
            System.err.println("Error in ChatbotController: " + e.getClass().getName());
            System.err.println("Error message: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "An error occurred while processing your message: " + e.getMessage());
            errorResponse.put("details", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "ok");
        response.put("service", "Chatbot Service");
        response.put("message", "Chatbot service is running. Use /api/chatbot/message to send messages.");
        return ResponseEntity.ok(response);
    }
}

