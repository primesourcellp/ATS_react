package com.example.Material_Mitra.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class RecruiterInterviewSummaryDTO {
    private Long id;
    private String candidateName;
    private String jobTitle;
    private LocalDate interviewDate;
    private LocalTime interviewTime;
    private LocalTime endTime;
    private LocalDate scheduledOn;

    public RecruiterInterviewSummaryDTO() {
    }

    public RecruiterInterviewSummaryDTO(Long id,
                                        String candidateName,
                                        String jobTitle,
                                        LocalDate interviewDate,
                                        LocalTime interviewTime,
                                        LocalTime endTime,
                                        LocalDate scheduledOn) {
        this.id = id;
        this.candidateName = candidateName;
        this.jobTitle = jobTitle;
        this.interviewDate = interviewDate;
        this.interviewTime = interviewTime;
        this.endTime = endTime;
        this.scheduledOn = scheduledOn;
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
}

