package com.example.Material_Mitra.scheduler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.Material_Mitra.service.UserActivityService;

/**
 * Scheduled task to automatically update user activity statuses
 * This ensures that users are marked as AWAY/OFFLINE even when system is sleeping
 * and no API calls are being made
 */
@Component
public class UserActivityScheduler {

    @Autowired
    private UserActivityService userActivityService;

    /**
     * Update all user statuses every 30 seconds
     * This automatically detects when users are inactive (system sleeping, no API calls)
     * and marks them as AWAY or OFFLINE based on their last activity time
     */
    @Scheduled(fixedRate = 30000) // Run every 30 seconds
    public void updateAllUserStatuses() {
        try {
            userActivityService.updateAllUserStatuses();
        } catch (Exception e) {
            // Log error but don't throw - scheduler should continue running
            System.err.println("Error updating user statuses in scheduler: " + e.getMessage());
        }
    }
}

