package com.example.Material_Mitra.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Material_Mitra.service.UserActivityService;
import com.example.Material_Mitra.service.UserActivityService.UserActivityStatusDTO;

@RestController
@RequestMapping("/api/user-activity")
public class UserActivityController {

    @Autowired
    private UserActivityService userActivityService;

    /**
     * Update current user's activity (call this on any user action)
     */
    @PostMapping("/ping")
    public ResponseEntity<String> ping() {
        userActivityService.updateCurrentUserActivity();
        return ResponseEntity.ok("Activity updated");
    }

    /**
     * Get current user's status
     */
    @GetMapping("/my-status")
    public ResponseEntity<Map<String, Object>> getMyStatus() {
        try {
            // Get current user from SecurityContext
            org.springframework.security.core.Authentication authentication = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.ok(Map.of("status", "OFFLINE"));
            }
            
            String username = authentication.getName();
            com.example.Material_Mitra.entity.User user = 
                userActivityService.getUserRepository().findByUsername(username).orElse(null);
            if (user == null) {
                return ResponseEntity.ok(Map.of("status", "OFFLINE"));
            }
            
            String status = userActivityService.getUserStatus(user.getId());
            return ResponseEntity.ok(Map.of("status", status));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("status", "OFFLINE"));
        }
    }

    /**
     * Get all users with their status
     */
    @GetMapping("/all")
    public ResponseEntity<List<UserActivityStatusDTO>> getAllUsersWithStatus() {
        List<UserActivityStatusDTO> users = userActivityService.getAllUsersWithStatus();
        return ResponseEntity.ok(users);
    }

    /**
     * Get specific user's status
     */
    @GetMapping("/user/{userId}/status")
    public ResponseEntity<String> getUserStatus(@PathVariable Long userId) {
        String status = userActivityService.getUserStatus(userId);
        return ResponseEntity.ok(status);
    }

    /**
     * Update all user statuses (called periodically)
     */
    @PostMapping("/update-all")
    public ResponseEntity<String> updateAllStatuses() {
        userActivityService.updateAllUserStatuses();
        return ResponseEntity.ok("All statuses updated");
    }
}

