package com.example.Material_Mitra.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Material_Mitra.entity.Notification;
import com.example.Material_Mitra.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    // Get all notifications
    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications() {
        List<Notification> notifications = notificationService.getAllNotifications();
        return ResponseEntity.ok(notifications);
    }
    
    // Get unread notifications
    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications() {
        List<Notification> notifications = notificationService.getUnreadNotifications();
        return ResponseEntity.ok(notifications);
    }
    
    // Get unread count
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        long count = notificationService.getUnreadCount();
        Map<String, Long> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }
    
    // Mark notification as read
    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        Notification notification = notificationService.markAsRead(id);
        if (notification != null) {
            return ResponseEntity.ok(notification);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Mark all notifications as read
    @PatchMapping("/mark-all-read")
    public ResponseEntity<Map<String, String>> markAllAsRead() {
        notificationService.markAllAsRead();
        Map<String, String> response = new HashMap<>();
        response.put("message", "All notifications marked as read");
        return ResponseEntity.ok(response);
    }
    
    // Delete notification
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable Long id) {
        Optional<Notification> notification = notificationService.getNotificationById(id);
        if (notification.isPresent()) {
            notificationService.deleteNotification(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Notification deleted successfully");
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Get notification by ID
    @GetMapping("/{id}")
    public ResponseEntity<Notification> getNotificationById(@PathVariable Long id) {
        Optional<Notification> notification = notificationService.getNotificationById(id);
        if (notification.isPresent()) {
            return ResponseEntity.ok(notification.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Create notification (for testing)
    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Map<String, String> request) {
        String title = request.get("title");
        String message = request.get("message");
        String type = request.get("type");
        
        if (title == null || message == null || type == null) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Notification notification = notificationService.createNotification(
                title, message, com.example.Material_Mitra.enums.NotificationType.valueOf(type.toUpperCase())
            );
            return ResponseEntity.ok(notification);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Test endpoint to create a sample notification
    @PostMapping("/test")
    public ResponseEntity<Notification> createTestNotification() {
        try {
            Notification notification = notificationService.createNotification(
                "Test Notification", 
                "This is a test notification to verify the system is working", 
                com.example.Material_Mitra.enums.NotificationType.GENERAL
            );
            return ResponseEntity.ok(notification);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    
    // Temporary endpoint to create the notifications table
    @PostMapping("/create-table")
    public ResponseEntity<String> createNotificationsTable() {
        try {
            // This will trigger Hibernate to create the table if it doesn't exist
            notificationService.getAllNotifications();
            return ResponseEntity.ok("Notifications table created successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating table: " + e.getMessage());
        }
    }
}
