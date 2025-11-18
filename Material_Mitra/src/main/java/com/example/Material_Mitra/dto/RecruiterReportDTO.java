package com.example.Material_Mitra.dto;

import java.time.LocalDate;
import java.util.List;

public class RecruiterReportDTO {
    private Long recruiterId;
    private String recruiterUsername;
    private String recruiterEmail;
    private LocalDate startDate;
    private LocalDate endDate;
    private int candidateCount;
    private int applicationCount;
    private int interviewCount;
    private List<RecruiterCandidateSummaryDTO> candidates;
    private List<RecruiterApplicationSummaryDTO> applications;
    private List<RecruiterInterviewSummaryDTO> interviews;

    public Long getRecruiterId() {
        return recruiterId;
    }

    public void setRecruiterId(Long recruiterId) {
        this.recruiterId = recruiterId;
    }

    public String getRecruiterUsername() {
        return recruiterUsername;
    }

    public void setRecruiterUsername(String recruiterUsername) {
        this.recruiterUsername = recruiterUsername;
    }

    public String getRecruiterEmail() {
        return recruiterEmail;
    }

    public void setRecruiterEmail(String recruiterEmail) {
        this.recruiterEmail = recruiterEmail;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public int getCandidateCount() {
        return candidateCount;
    }

    public void setCandidateCount(int candidateCount) {
        this.candidateCount = candidateCount;
    }

    public int getApplicationCount() {
        return applicationCount;
    }

    public void setApplicationCount(int applicationCount) {
        this.applicationCount = applicationCount;
    }

    public int getInterviewCount() {
        return interviewCount;
    }

    public void setInterviewCount(int interviewCount) {
        this.interviewCount = interviewCount;
    }

    public List<RecruiterCandidateSummaryDTO> getCandidates() {
        return candidates;
    }

    public void setCandidates(List<RecruiterCandidateSummaryDTO> candidates) {
        this.candidates = candidates;
    }

    public List<RecruiterApplicationSummaryDTO> getApplications() {
        return applications;
    }

    public void setApplications(List<RecruiterApplicationSummaryDTO> applications) {
        this.applications = applications;
    }

    public List<RecruiterInterviewSummaryDTO> getInterviews() {
        return interviews;
    }

    public void setInterviews(List<RecruiterInterviewSummaryDTO> interviews) {
        this.interviews = interviews;
    }
}

