package com.example.Material_Mitra.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class InterviewDetailDTO {
    private Long id;
    private LocalDate interviewDate;
    private LocalTime interviewTime;
    private LocalTime endTime;
    private LocalDate scheduledOn;
    private LocalDateTime completedAt;
    private String description;
    private String status;
    
    // Scheduling information
    private Long scheduledByUserId;
    private String scheduledByName;
    private String scheduledByEmail;
    
    // Application information
    private Long applicationId;
    private String candidateName;
    private Long candidateId;
    private String jobTitle;
    private Long jobId;
    private String clientName;
    private Long clientId;
    private String applicationStatus;
    
    // Status history
    private List<StatusHistoryDTO> statusHistory;

    public InterviewDetailDTO() {}

    // Getters and Setters
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

    public LocalDate getScheduledOn() {
        return scheduledOn;
    }

    public void setScheduledOn(LocalDate scheduledOn) {
        this.scheduledOn = scheduledOn;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public Long getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(Long applicationId) {
        this.applicationId = applicationId;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public Long getCandidateId() {
        return candidateId;
    }

    public void setCandidateId(Long candidateId) {
        this.candidateId = candidateId;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public Long getClientId() {
        return clientId;
    }

    public void setClientId(Long clientId) {
        this.clientId = clientId;
    }

    public String getApplicationStatus() {
        return applicationStatus;
    }

    public void setApplicationStatus(String applicationStatus) {
        this.applicationStatus = applicationStatus;
    }

    public List<StatusHistoryDTO> getStatusHistory() {
        return statusHistory;
    }

    public void setStatusHistory(List<StatusHistoryDTO> statusHistory) {
        this.statusHistory = statusHistory;
    }
}

