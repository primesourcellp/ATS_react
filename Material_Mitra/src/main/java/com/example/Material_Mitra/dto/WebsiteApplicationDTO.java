package com.example.Material_Mitra.dto;

import java.time.LocalDateTime;

public class WebsiteApplicationDTO {

    private Long id;
    private String applierName;
    private String email;
    private String phoneNumber;
    private String currentLocation;
    private Double currentCtc;
    private String workingCompanyName;
    private String workRole;
    private Double totalExperience;
    private String skills;
    private String resumePath;
    private LocalDateTime appliedAt;
    private String currentlyWorking;
    private String jobName;
    private String clientName;
    
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }


    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApplierName() { return applierName; }
    public void setApplierName(String applierName) { this.applierName = applierName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(String currentLocation) { this.currentLocation = currentLocation; }

    public Double getCurrentCtc() { return currentCtc; }
    public void setCurrentCtc(Double currentCtc) { this.currentCtc = currentCtc; }

    public String getWorkingCompanyName() { return workingCompanyName; }
    public void setWorkingCompanyName(String workingCompanyName) { this.workingCompanyName = workingCompanyName; }

    public String getWorkRole() { return workRole; }
    public void setWorkRole(String workRole) { this.workRole = workRole; }

    public Double getTotalExperience() { return totalExperience; }
    public void setTotalExperience(Double totalExperience) { this.totalExperience = totalExperience; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getResumePath() { return resumePath; }
    public void setResumePath(String resumePath) { this.resumePath = resumePath; }

    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }

    public String getCurrentlyWorking() { return currentlyWorking; }
    public void setCurrentlyWorking(String currentlyWorking) { this.currentlyWorking = currentlyWorking; }

    public String getJobName() { return jobName; }
    public void setJobName(String jobName) { this.jobName = jobName; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
}
