package com.example.Material_Mitra.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class InterviewDTO {
    private Long id;
    private String candidateName;
    private String jobTitle;
    private String clientName; // ✅ Added client name
    private LocalDate interviewDate;
    private LocalTime interviewTime;
    private LocalTime endTime;

    public InterviewDTO() {}

    public InterviewDTO(Long id, String candidateName, String jobTitle, String clientName,
                            LocalDate interviewDate, LocalTime interviewTime, LocalTime endTime) {
        this.id = id;
        this.candidateName = candidateName;
        this.jobTitle = jobTitle;
        this.clientName = clientName;
        this.interviewDate = interviewDate;
        this.interviewTime = interviewTime;
        this.endTime = endTime;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public LocalDate getInterviewDate() { return interviewDate; }
    public void setInterviewDate(LocalDate interviewDate) { this.interviewDate = interviewDate; }
    public LocalTime getInterviewTime() { return interviewTime; }
    public void setInterviewTime(LocalTime interviewTime) { this.interviewTime = interviewTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
}
