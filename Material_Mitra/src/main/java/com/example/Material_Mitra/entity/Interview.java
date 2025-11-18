package com.example.Material_Mitra.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate interviewDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime interviewTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;
    
    private LocalDate scheduledOn;
    
   
    @ManyToOne
    @JoinColumn(name = "application_id", nullable = true)
    @JsonBackReference
    private JobApplication application;
    
    @ManyToOne
    @JoinColumn(name = "scheduled_by_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User scheduledBy;

    @Column(name = "scheduled_by_user_id")
    private Long scheduledByUserId;

    @Column(name = "scheduled_by_name", length = 150)
    private String scheduledByName;

    @Column(name = "scheduled_by_email", length = 200)
    private String scheduledByEmail;

    // ===== Getters & Setters =====

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getInterviewDate() {
        return interviewDate;
    }

    public void setInterviewDate(LocalDate interviewDate) {
        this.interviewDate = interviewDate;
    }

    public LocalTime getInterviewTime() {
        return interviewTime;
    }

    public void setInterviewTime(LocalTime interviewTime) {
        this.interviewTime = interviewTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public JobApplication getApplication() {
        return application;
    }

    public void setApplication(JobApplication application) {
        this.application = application;
    }

    public LocalDate getScheduledOn() {
        return scheduledOn;
    }

    public void setScheduledOn(LocalDate scheduledOn) {
        this.scheduledOn = scheduledOn;
    }

    public User getScheduledBy() {
        return scheduledBy;
    }

    public void setScheduledBy(User scheduledBy) {
        this.scheduledBy = scheduledBy;
    }

    public Long getScheduledByUserId() {
        return scheduledByUserId;
    }

    public void setScheduledByUserId(Long scheduledByUserId) {
        this.scheduledByUserId = scheduledByUserId;
    }

    public String getScheduledByName() {
        return scheduledByName;
    }

    public void setScheduledByName(String scheduledByName) {
        this.scheduledByName = scheduledByName;
    }

    public String getScheduledByEmail() {
        return scheduledByEmail;
    }

    public void setScheduledByEmail(String scheduledByEmail) {
        this.scheduledByEmail = scheduledByEmail;
    }
}
