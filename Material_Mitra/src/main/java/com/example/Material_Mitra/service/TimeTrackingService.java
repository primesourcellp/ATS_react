package com.example.Material_Mitra.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Material_Mitra.dto.TimeTrackingDTO;
import com.example.Material_Mitra.entity.TimeTracking;
import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.entity.UserActivity;
import com.example.Material_Mitra.repository.TimeTrackingRepository;
import com.example.Material_Mitra.repository.UserRepository;
import com.example.Material_Mitra.repository.UserActivityRepository;

@Service
public class TimeTrackingService {

    @Autowired
    private TimeTrackingRepository timeTrackingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    @Lazy
    private UserActivityRepository userActivityRepository;

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

    @Transactional
    public TimeTrackingDTO recordLogin(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user already has an active session
        Optional<TimeTracking> existingActive = timeTrackingRepository.findByUserAndIsActiveTrue(user);
        if (existingActive.isPresent()) {
            TimeTracking existing = existingActive.get();
            // Check if the existing session is stale (older than 24 hours)
            LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
            if (existing.getLoginTime() != null && existing.getLoginTime().isBefore(twentyFourHoursAgo)) {
                // Close stale session
                existing.setLogoutTime(LocalDateTime.now());
                existing.setActive(false);
                if (existing.getLoginTime() != null) {
                    Duration duration = Duration.between(existing.getLoginTime(), existing.getLogoutTime());
                    existing.setWorkingMinutes(duration.toMinutes());
                }
                timeTrackingRepository.save(existing);
                System.out.println("Closed stale session for user: " + user.getUsername() + " before creating new login");
            } else {
                // User already has a valid active session, return it
                return convertToDTO(existing);
            }
        }

        // Create new login session
        TimeTracking tracking = new TimeTracking();
        tracking.setUser(user);
        tracking.setLoginTime(LocalDateTime.now());
        tracking.setActive(true);
        tracking = timeTrackingRepository.save(tracking);
        System.out.println("New login session created for user: " + user.getUsername());

        // Update user activity status to ONLINE
        if (userActivityRepository != null) {
            try {
                userActivityRepository.findByUser(user).ifPresent(activity -> {
                    activity.setStatus("ONLINE");
                    activity.setLastActivityTime(LocalDateTime.now());
                    userActivityRepository.save(activity);
                });
            } catch (Exception e) {
                System.err.println("Failed to update user activity on login: " + e.getMessage());
            }
        }

        return convertToDTO(tracking);
    }

    @Transactional
    public TimeTrackingDTO recordLogout(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<TimeTracking> activeSession = timeTrackingRepository.findByUserAndIsActiveTrue(user);
        if (activeSession.isEmpty()) {
            // If no active session, try to find the most recent session without logout time
            List<TimeTracking> recentSessions = timeTrackingRepository.findByUserOrderByLoginTimeDesc(user);
            if (!recentSessions.isEmpty()) {
                TimeTracking latestSession = recentSessions.get(0);
                // Only update if it doesn't have a logout time yet
                if (latestSession.getLogoutTime() == null) {
                    latestSession.setLogoutTime(LocalDateTime.now());
                    latestSession.setActive(false);
                    if (latestSession.getLoginTime() != null) {
                        Duration duration = Duration.between(latestSession.getLoginTime(), latestSession.getLogoutTime());
                        latestSession.setWorkingMinutes(duration.toMinutes());
                    }
                    latestSession = timeTrackingRepository.save(latestSession);
                    return convertToDTO(latestSession);
                }
            }
            // If still no session to update, log warning but don't throw exception
            System.out.println("Warning: No active session found for user ID: " + userId + " (username: " + user.getUsername() + ")");
            return null;
        }

        TimeTracking tracking = activeSession.get();
        LocalDateTime logoutTime = LocalDateTime.now();
        tracking.setLogoutTime(logoutTime);
        tracking.setActive(false);
        
        // Calculate working minutes
        if (tracking.getLoginTime() != null) {
            Duration duration = Duration.between(tracking.getLoginTime(), logoutTime);
            tracking.setWorkingMinutes(duration.toMinutes());
        }

        tracking = timeTrackingRepository.save(tracking);
        System.out.println("Logout recorded for user: " + user.getUsername() + ", working time: " + tracking.getWorkingMinutes() + " minutes");

        // Force flush to ensure database is updated immediately
        timeTrackingRepository.flush();
        
        // Update user activity status to OFFLINE
        if (userActivityRepository != null) {
            try {
                // Directly update activity status to OFFLINE
                userActivityRepository.findByUser(user).ifPresent(activity -> {
                    activity.setStatus("OFFLINE");
                    activity.setLastActivityTime(LocalDateTime.now());
                    userActivityRepository.save(activity);
                });
            } catch (Exception e) {
                System.err.println("Failed to update user activity on logout: " + e.getMessage());
            }
        }

        return convertToDTO(tracking);
    }

    public List<TimeTrackingDTO> getAllActiveSessions() {
        // Query directly from repository with strict criteria
        List<TimeTracking> activeSessions = timeTrackingRepository.findAllActiveSessions();
        
        // Clean up stale sessions (sessions older than 24 hours without logout)
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        List<TimeTracking> staleSessions = activeSessions.stream()
            .filter(session -> session.getLoginTime() != null && 
                             session.getLoginTime().isBefore(twentyFourHoursAgo))
            .collect(Collectors.toList());
        
        // Auto-close stale sessions
        for (TimeTracking stale : staleSessions) {
            stale.setLogoutTime(LocalDateTime.now());
            stale.setActive(false);
            if (stale.getLoginTime() != null) {
                Duration duration = Duration.between(stale.getLoginTime(), stale.getLogoutTime());
                stale.setWorkingMinutes(duration.toMinutes());
            }
            timeTrackingRepository.save(stale);
            System.out.println("Auto-closed stale session for user: " + stale.getUser().getUsername());
        }
        
        // Filter out stale sessions and ensure strict criteria
        List<TimeTracking> validActiveSessions = activeSessions.stream()
            .filter(session -> !staleSessions.contains(session))
            .filter(session -> session.getLoginTime() != null)
            .filter(session -> session.getLogoutTime() == null) // CRITICAL: Only sessions without logout
            .filter(session -> session.isActive()) // CRITICAL: Double check isActive flag
            .collect(Collectors.toList());
        
        // Additional safety check: verify in database that these are truly active
        List<TimeTracking> verifiedActive = new java.util.ArrayList<>();
        for (TimeTracking session : validActiveSessions) {
            // Re-query from database to ensure it's still active
            Optional<TimeTracking> dbSession = timeTrackingRepository.findById(session.getId());
            if (dbSession.isPresent()) {
                TimeTracking db = dbSession.get();
                if (db.isActive() && db.getLogoutTime() == null && db.getLoginTime() != null) {
                    verifiedActive.add(db);
                }
            }
        }
        
        return verifiedActive.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<TimeTrackingDTO> getUserSessions(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<TimeTracking> sessions = timeTrackingRepository.findByUserOrderByLoginTimeDesc(user);
        return sessions.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<TimeTrackingDTO> getUserSessionsByDate(Long userId, LocalDate date) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<TimeTracking> sessions = timeTrackingRepository.findByUserAndDate(user, date);
        return sessions.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public TimeTrackingDTO getCurrentUserSession() {
        Optional<User> currentUser = getCurrentUser();
        if (currentUser.isEmpty()) {
            return null;
        }

        Optional<TimeTracking> activeSession = timeTrackingRepository.findByUserAndIsActiveTrue(currentUser.get());
        if (activeSession.isEmpty()) {
            return null;
        }

        return convertToDTO(activeSession.get());
    }

    public Long getTotalWorkingMinutesToday(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        LocalDate today = LocalDate.now();
        Long totalMinutes = timeTrackingRepository.getTotalWorkingMinutesByUserAndDate(user, today);
        
        // Add current active session if exists
        Optional<TimeTracking> activeSession = timeTrackingRepository.findByUserAndIsActiveTrue(user);
        if (activeSession.isPresent()) {
            TimeTracking session = activeSession.get();
            if (session.getLoginTime() != null && 
                session.getLoginTime().toLocalDate().equals(today)) {
                Duration duration = Duration.between(session.getLoginTime(), LocalDateTime.now());
                totalMinutes = (totalMinutes != null ? totalMinutes : 0L) + duration.toMinutes();
            }
        }
        
        return totalMinutes != null ? totalMinutes : 0L;
    }

    private TimeTrackingDTO convertToDTO(TimeTracking tracking) {
        TimeTrackingDTO dto = new TimeTrackingDTO();
        dto.setId(tracking.getId());
        dto.setUserId(tracking.getUser().getId());
        dto.setUsername(tracking.getUser().getUsername());
        dto.setEmail(tracking.getUser().getEmail());
        dto.setRole(tracking.getUser().getRole() != null ? tracking.getUser().getRole().name() : null);
        dto.setLoginTime(tracking.getLoginTime());
        dto.setLogoutTime(tracking.getLogoutTime());
        dto.setActive(tracking.isActive());
        
        // Calculate working minutes
        Long workingMinutes = tracking.getWorkingMinutes();
        if (tracking.isActive() && tracking.getLoginTime() != null) {
            Duration duration = Duration.between(tracking.getLoginTime(), LocalDateTime.now());
            workingMinutes = duration.toMinutes();
        }
        dto.setWorkingMinutes(workingMinutes);
        
        // Get user status (ONLINE, AWAY, OFFLINE) from activity repository
        if (userActivityRepository != null && tracking.isActive()) {
            try {
                userActivityRepository.findByUser(tracking.getUser()).ifPresent(activity -> {
                    dto.setStatus(activity.getStatus());
                    dto.setLastActivityTime(activity.getLastActivityTime());
                });
                // If no activity record found, default to ONLINE if active
                if (dto.getStatus() == null) {
                    dto.setStatus("ONLINE");
                }
            } catch (Exception e) {
                // If activity repository not available, default to ONLINE if active
                dto.setStatus(tracking.isActive() ? "ONLINE" : "OFFLINE");
            }
        } else {
            dto.setStatus(tracking.isActive() ? "ONLINE" : "OFFLINE");
        }
        
        dto.setCreatedAt(tracking.getCreatedAt());
        dto.setUpdatedAt(tracking.getUpdatedAt());
        
        return dto;
    }

    /**
     * Clean up all stale active sessions in the database
     * This method can be called periodically to ensure data integrity
     */
    @Transactional
    public int cleanupStaleSessions() {
        List<TimeTracking> allActiveSessions = timeTrackingRepository.findByIsActiveTrue();
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        
        int cleanedCount = 0;
        for (TimeTracking session : allActiveSessions) {
            // Close sessions that are older than 24 hours or have logout time but are still marked active
            boolean isStale = (session.getLoginTime() != null && session.getLoginTime().isBefore(twentyFourHoursAgo)) ||
                             (session.getLogoutTime() != null && session.isActive());
            
            if (isStale) {
                if (session.getLogoutTime() == null) {
                    session.setLogoutTime(LocalDateTime.now());
                }
                session.setActive(false);
                if (session.getLoginTime() != null && session.getLogoutTime() != null) {
                    Duration duration = Duration.between(session.getLoginTime(), session.getLogoutTime());
                    session.setWorkingMinutes(duration.toMinutes());
                }
                timeTrackingRepository.save(session);
                cleanedCount++;
                System.out.println("Cleaned up stale session for user: " + session.getUser().getUsername());
            }
        }
        
        return cleanedCount;
    }
}

