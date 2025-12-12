package com.example.Material_Mitra.entity;

import java.time.LocalDateTime;
import java.time.Duration;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TimeTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer", "handler"})
    private User user;

    @Column(nullable = false)
    private LocalDateTime loginTime;

    @Column
    private LocalDateTime logoutTime;

    @Column
    private Long workingMinutes; // Total working minutes for this session

    @Column
    private boolean isActive; // true if user is currently logged in

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (loginTime == null) {
            loginTime = LocalDateTime.now();
        }
        if (isActive && logoutTime == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        // Calculate working minutes if logout time is set
        if (logoutTime != null && loginTime != null) {
            Duration duration = Duration.between(loginTime, logoutTime);
            workingMinutes = duration.toMinutes();
            isActive = false;
        } else if (loginTime != null && isActive) {
            // Calculate current working time for active sessions
            Duration duration = Duration.between(loginTime, LocalDateTime.now());
            workingMinutes = duration.toMinutes();
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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
        // Recalculate working minutes when logout is set
        if (logoutTime != null && loginTime != null) {
            Duration duration = Duration.between(loginTime, logoutTime);
            this.workingMinutes = duration.toMinutes();
            this.isActive = false;
        }
    }

    public Long getWorkingMinutes() {
        if (isActive && loginTime != null) {
            // Calculate current working time for active sessions
            Duration duration = Duration.between(loginTime, LocalDateTime.now());
            return duration.toMinutes();
        }
        return workingMinutes;
    }

    public void setWorkingMinutes(Long workingMinutes) {
        this.workingMinutes = workingMinutes;
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

    // Helper method to get working hours as string (e.g., "8h 30m")
    public String getWorkingHoursFormatted() {
        Long minutes = getWorkingMinutes();
        if (minutes == null) return "0h 0m";
        long hours = minutes / 60;
        long mins = minutes % 60;
        return hours + "h " + mins + "m";
    }
}

