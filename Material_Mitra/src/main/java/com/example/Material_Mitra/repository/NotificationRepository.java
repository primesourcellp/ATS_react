package com.example.Material_Mitra.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Material_Mitra.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Find all notifications ordered by creation date (newest first)
    List<Notification> findAllByOrderByCreatedAtDesc();
    
    // Find unread notifications
    List<Notification> findByReadFalseOrderByCreatedAtDesc();
    
    // Count unread notifications
    long countByReadFalse();
    
    // Find notifications by type
    List<Notification> findByTypeOrderByCreatedAtDesc(String type);
    
    // Find notifications by related entity
    List<Notification> findByRelatedEntityIdAndRelatedEntityTypeOrderByCreatedAtDesc(
        Long relatedEntityId, String relatedEntityType);
    
    // Delete old notifications (older than specified days)
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    void deleteOldNotifications(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);
}
