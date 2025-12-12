package com.example.Material_Mitra.dto;

import java.time.LocalDateTime;

public class TimeTrackingDTO {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private String role;
    private LocalDateTime loginTime;
    private LocalDateTime logoutTime;
    private Long workingMinutes;
    private String workingHoursFormatted;
    private boolean isActive;
    private String status; // ONLINE, AWAY, OFFLINE
    private LocalDateTime lastActivityTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TimeTrackingDTO() {}

    public TimeTrackingDTO(Long id, Long userId, String username, String email, String role,
                          LocalDateTime loginTime, LocalDateTime logoutTime, Long workingMinutes,
                          boolean isActive) {
        this.id = id;
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.role = role;
        this.loginTime = loginTime;
        this.logoutTime = logoutTime;
        this.workingMinutes = workingMinutes;
        this.isActive = isActive;
        if (workingMinutes != null) {
            long hours = workingMinutes / 60;
            long mins = workingMinutes % 60;
            this.workingHoursFormatted = hours + "h " + mins + "m";
        } else {
            this.workingHoursFormatted = "0h 0m";
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getLoginTime() {
        return loginTime;
    }

    public void setLoginTime(LocalDateTime loginTime) {
        this.loginTime = loginTime;
    }

    public LocalDateTime getLogoutTime() {
        return logoutTime;
    }

    public void setLogoutTime(LocalDateTime logoutTime) {
        this.logoutTime = logoutTime;
    }

    public Long getWorkingMinutes() {
        return workingMinutes;
    }

    public void setWorkingMinutes(Long workingMinutes) {
        this.workingMinutes = workingMinutes;
        if (workingMinutes != null) {
            long hours = workingMinutes / 60;
            long mins = workingMinutes % 60;
            this.workingHoursFormatted = hours + "h " + mins + "m";
        } else {
            this.workingHoursFormatted = "0h 0m";
        }
    }

    public String getWorkingHoursFormatted() {
        return workingHoursFormatted;
    }

    public void setWorkingHoursFormatted(String workingHoursFormatted) {
        this.workingHoursFormatted = workingHoursFormatted;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
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

