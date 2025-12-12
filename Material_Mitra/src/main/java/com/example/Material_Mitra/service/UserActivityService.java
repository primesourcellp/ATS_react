package com.example.Material_Mitra.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Material_Mitra.entity.TimeTracking;
import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.entity.UserActivity;
import com.example.Material_Mitra.repository.TimeTrackingRepository;
import com.example.Material_Mitra.repository.UserActivityRepository;
import com.example.Material_Mitra.repository.UserRepository;

@Service
public class UserActivityService {

    @Autowired
    private UserActivityRepository userActivityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    @Lazy
    private TimeTrackingService timeTrackingService;

    @Autowired(required = false)
    @Lazy
    private TimeTrackingRepository timeTrackingRepository;

    // Expose repository for controller access
    public UserRepository getUserRepository() {
        return userRepository;
    }

    private static final int AWAY_THRESHOLD_MINUTES = 2; // 2 minutes of inactivity = AWAY (like Microsoft Teams)
    private static final int OFFLINE_THRESHOLD_MINUTES = 15; // 15 minutes of inactivity = OFFLINE

    private Optional<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        String username = authentication.getName();
        if (username == null || "anonymousUser".equalsIgnoreCase(username)) {
            return Optional.empty();
        }
        return userRepository.findByUsername(username);
    }

    /**
     * Update user's last activity time (called on any API request)
     * Works across all browsers/tabs - any activity updates the status
     */
    @Transactional
    public void updateUserActivity(Long userId) {
        User user = userRepository.findById(userId)
            .orElse(null);
        if (user == null) return;

        // Check if user has active session (works across all browsers/tabs)
        boolean hasActiveSession = false;
        if (timeTrackingRepository != null) {
            try {
                Optional<TimeTracking> activeSession = timeTrackingRepository.findByUserAndIsActiveTrue(user);
                hasActiveSession = activeSession.isPresent() && 
                    activeSession.get().getLoginTime() != null && 
                    activeSession.get().getLogoutTime() == null;
            } catch (Exception e) {
                // Ignore
            }
        }

        // Only update activity if user has active session
        if (!hasActiveSession) {
            return; // User is not logged in, don't update activity
        }

        Optional<UserActivity> activityOpt = userActivityRepository.findByUser(user);
        UserActivity activity;

        if (activityOpt.isPresent()) {
            activity = activityOpt.get();
        } else {
            // Create new activity record
            activity = new UserActivity();
            activity.setUser(user);
            activity.setStatus("ONLINE");
        }

        LocalDateTime now = LocalDateTime.now();
        activity.setLastActivityTime(now);

        // Immediately update status to ONLINE on any activity
        // This ensures AWAY status changes to ONLINE as soon as user interacts
        // Works across all browsers/tabs - if user is active in ANY tab, they show as ONLINE
        if (!"ONLINE".equals(activity.getStatus())) {
            activity.setStatus("ONLINE");
            activity.setLastStatusChange(now);
        }

        userActivityRepository.save(activity);
    }

    /**
     * Update current user's activity (called automatically)
     */
    @Transactional
    public void updateCurrentUserActivity() {
        Optional<User> currentUser = getCurrentUser();
        if (currentUser.isPresent()) {
            updateUserActivity(currentUser.get().getId());
        }
    }

    /**
     * Get user's current status (ONLINE, AWAY, OFFLINE)
     * Works across all browsers/tabs - if user is active in ANY tab, shows ONLINE
     */
    public String getUserStatus(Long userId) {
        User user = userRepository.findById(userId)
            .orElse(null);
        if (user == null) return "OFFLINE";

        Optional<UserActivity> activityOpt = userActivityRepository.findByUser(user);
        
        // Check if user has ANY active time tracking session (works across all browsers/tabs)
        boolean hasActiveSession = false;
        if (timeTrackingRepository != null) {
            try {
                Optional<TimeTracking> activeSession = timeTrackingRepository.findByUserAndIsActiveTrue(user);
                hasActiveSession = activeSession.isPresent() && 
                    activeSession.get().getLoginTime() != null && 
                    activeSession.get().getLogoutTime() == null;
            } catch (Exception e) {
                // Ignore
            }
        }

        // If no active session, user is OFFLINE
        if (!hasActiveSession) {
            if (activityOpt.isPresent()) {
                UserActivity activity = activityOpt.get();
                if (!"OFFLINE".equals(activity.getStatus())) {
                    activity.setStatus("OFFLINE");
                    userActivityRepository.save(activity);
                }
            }
            return "OFFLINE";
        }

        // User has active session - check activity time
        if (activityOpt.isEmpty()) {
            // Create activity record if it doesn't exist
            UserActivity activity = new UserActivity();
            activity.setUser(user);
            activity.setLastActivityTime(LocalDateTime.now());
            activity.setStatus("ONLINE");
            userActivityRepository.save(activity);
            return "ONLINE";
        }

        UserActivity activity = activityOpt.get();
        LocalDateTime lastActivity = activity.getLastActivityTime();
        
        // If no last activity time, set to now and return ONLINE
        if (lastActivity == null) {
            activity.setLastActivityTime(LocalDateTime.now());
            activity.setStatus("ONLINE");
            userActivityRepository.save(activity);
            return "ONLINE";
        }

        LocalDateTime now = LocalDateTime.now();
        long minutesSinceActivity = java.time.Duration.between(lastActivity, now).toMinutes();

        // Determine status based on activity (works across all browsers/tabs)
        // If user is active in ANY tab, they show as ONLINE
        // If user is logged in but inactive, show as AWAY
        if (minutesSinceActivity <= AWAY_THRESHOLD_MINUTES) {
            // Recent activity = ONLINE
            if (!"ONLINE".equals(activity.getStatus())) {
                activity.setStatus("ONLINE");
                userActivityRepository.save(activity);
            }
            return "ONLINE";
        } else if (minutesSinceActivity <= OFFLINE_THRESHOLD_MINUTES) {
            // Inactive but still within threshold = AWAY
            if (!"AWAY".equals(activity.getStatus())) {
                activity.setStatus("AWAY");
                userActivityRepository.save(activity);
            }
            return "AWAY";
        } else {
            // Too long inactive = OFFLINE (even if session exists, mark as offline)
            if (!"OFFLINE".equals(activity.getStatus())) {
                activity.setStatus("OFFLINE");
                userActivityRepository.save(activity);
            }
            return "OFFLINE";
        }
    }

    /**
     * Get all users with their current status
     */
    public List<UserActivityStatusDTO> getAllUsersWithStatus() {
        List<User> allUsers = userRepository.findAll();
        return allUsers.stream()
            .map(user -> {
                String status = getUserStatus(user.getId());
                Optional<UserActivity> activityOpt = userActivityRepository.findByUser(user);
                LocalDateTime lastActivity = activityOpt.map(UserActivity::getLastActivityTime).orElse(null);
                
                UserActivityStatusDTO dto = new UserActivityStatusDTO();
                dto.setUserId(user.getId());
                dto.setUsername(user.getUsername());
                dto.setEmail(user.getEmail());
                dto.setRole(user.getRole() != null ? user.getRole().name() : null);
                dto.setStatus(status);
                dto.setLastActivityTime(lastActivity);
                return dto;
            })
            .collect(Collectors.toList());
    }

    /**
     * Update status for all users (called periodically)
     */
    @Transactional
    public void updateAllUserStatuses() {
        List<UserActivity> allActivities = userActivityRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (UserActivity activity : allActivities) {
            LocalDateTime lastActivity = activity.getLastActivityTime();
            if (lastActivity == null) {
                activity.setStatus("OFFLINE");
                userActivityRepository.save(activity);
                continue;
            }

            long minutesSinceActivity = java.time.Duration.between(lastActivity, now).toMinutes();

            // Check if user has active time tracking session directly from repository (avoid circular dependency)
            boolean hasActiveSession = false;
            if (timeTrackingRepository != null) {
                try {
                    Optional<TimeTracking> activeSession = timeTrackingRepository.findByUserAndIsActiveTrue(activity.getUser());
                    hasActiveSession = activeSession.isPresent() && 
                        activeSession.get().getLoginTime() != null && 
                        activeSession.get().getLogoutTime() == null;
                } catch (Exception e) {
                    // Ignore
                }
            }

            if (!hasActiveSession) {
                activity.setStatus("OFFLINE");
                userActivityRepository.save(activity);
                continue;
            }

            // User has active session
            if (minutesSinceActivity <= AWAY_THRESHOLD_MINUTES) {
                if (!"ONLINE".equals(activity.getStatus())) {
                    activity.setStatus("ONLINE");
                    userActivityRepository.save(activity);
                }
            } else if (minutesSinceActivity <= OFFLINE_THRESHOLD_MINUTES) {
                if (!"AWAY".equals(activity.getStatus())) {
                    activity.setStatus("AWAY");
                    userActivityRepository.save(activity);
                }
            } else {
                if (!"OFFLINE".equals(activity.getStatus())) {
                    activity.setStatus("OFFLINE");
                    userActivityRepository.save(activity);
                }
            }
        }
    }

    // DTO for user status
    public static class UserActivityStatusDTO {
        private Long userId;
        private String username;
        private String email;
        private String role;
        private String status;
        private LocalDateTime lastActivityTime;

        // Getters and Setters
        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public LocalDateTime getLastActivityTime() {
            return lastActivityTime;
        }

        public void setLastActivityTime(LocalDateTime lastActivityTime) {
            this.lastActivityTime = lastActivityTime;
        }
    }
}

