package com.example.Material_Mitra.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Material_Mitra.entity.Notification;
import com.example.Material_Mitra.enums.NotificationType;
import com.example.Material_Mitra.repository.NotificationRepository;

@Service
public class NotificationService {
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    // Create a new notification
    public Notification createNotification(String title, String message, NotificationType type) {
        Notification notification = new Notification(title, message, type);
        return notificationRepository.save(notification);
    }
    
    // Create a notification with related entity
    public Notification createNotification(String title, String message, NotificationType type, 
                                         Long relatedEntityId, String relatedEntityType) {
        Notification notification = new Notification(title, message, type, relatedEntityId, relatedEntityType);
        return notificationRepository.save(notification);
    }
    
    // Get all notifications
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }
    
    // Get unread notifications
    public List<Notification> getUnreadNotifications() {
        return notificationRepository.findByReadFalseOrderByCreatedAtDesc();
    }
    
    // Get unread count
    public long getUnreadCount() {
        return notificationRepository.countByReadFalse();
    }
    
    // Mark notification as read
    public Notification markAsRead(Long notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setRead(true);
            return notificationRepository.save(notification);
        }
        return null;
    }
    
    // Mark all notifications as read
    public void markAllAsRead() {
        List<Notification> unreadNotifications = notificationRepository.findByReadFalseOrderByCreatedAtDesc();
        for (Notification notification : unreadNotifications) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(unreadNotifications);
    }
    
    // Delete notification
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
    
    // Get notification by ID
    public Optional<Notification> getNotificationById(Long notificationId) {
        return notificationRepository.findById(notificationId);
    }
    
    // Create notification for new website application
    public Notification createNewApplicationNotification(String candidateName, String jobName, Long applicationId) {
        System.out.println("🔔 NotificationService: Creating notification for application " + applicationId);
        String title = "New Website Application";
        String message = String.format("%s has applied for the position: %s", candidateName, jobName);
        
        System.out.println("🔔 NotificationService: Title: " + title);
        System.out.println("🔔 NotificationService: Message: " + message);
        System.out.println("🔔 NotificationService: Type: NEW_APPLICATION");
        
        Notification notification = createNotification(title, message, NotificationType.NEW_APPLICATION, 
                                applicationId, "WEBSITE_APPLICATION");
        
        System.out.println("✅ NotificationService: Notification created with ID: " + notification.getId());
        return notification;
    }
    
    // Create notification for application status update
    public Notification createApplicationUpdateNotification(String candidateName, String jobName, 
                                                          String status, Long applicationId) {
        String title = "Application Status Updated";
        String message = String.format("Application for %s by %s has been updated to: %s", 
                                     jobName, candidateName, status);
        return createNotification(title, message, NotificationType.APPLICATION_UPDATE, 
                                applicationId, "WEBSITE_APPLICATION");
    }
    
    // Clean up old notifications (older than 30 days)
    public void cleanupOldNotifications() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        notificationRepository.deleteOldNotifications(cutoffDate);
    }
}
