package com.example.Material_Mitra.dto;

import java.time.LocalDate;

public class RecruiterApplicationSummaryDTO {
    private Long id;
    private String candidateName;
    private String jobTitle;
    private String status;
    private LocalDate appliedAt;

    public RecruiterApplicationSummaryDTO() {
    }

    public RecruiterApplicationSummaryDTO(Long id, String candidateName, String jobTitle, String status, LocalDate appliedAt) {
        this.id = id;
        this.candidateName = candidateName;
        this.jobTitle = jobTitle;
        this.status = status;
        this.appliedAt = appliedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(LocalDate appliedAt) {
        this.appliedAt = appliedAt;
    }
}

