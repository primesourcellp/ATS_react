package com.example.Material_Mitra.dto;

import java.time.LocalDate;

public class JobApplicationDTO {
    private Long id;
    private JobDTO job;
    private CandidateDTO candidate;
    private String status;              // ✅ Add status as String
    private LocalDate appliedAt;        // ✅ Add appliedAt
    private String candidateName;
    private boolean resumeAvailable;
    private String applicationResumePath;
    private String applicationResumeUrl;
    private boolean hasInterviews;
//    private boolean useMasterResume;
    
    
    // Getters
    public Long getId() { return id; }
    public JobDTO getJob() { return job; }
    public CandidateDTO getCandidate() { return candidate; }
    public String getStatus() { return status; }
    public LocalDate getAppliedAt() { return appliedAt; }
    public boolean isResumeAvailable() { return resumeAvailable; }
    public boolean isHasInterviews() { return hasInterviews; }
    // Setters
    public void setId(Long id) { this.id = id; }
    public void setJob(JobDTO job) { this.job = job; }
    public void setCandidate(CandidateDTO candidate) { this.candidate = candidate; }
    public void setStatus(String status) { this.status = status; }
    public void setAppliedAt(LocalDate appliedAt) { this.appliedAt = appliedAt; }
    public void setResumeAvailable(boolean resumeAvailable) { this.resumeAvailable = resumeAvailable; }
    public void setHasInterviews(boolean hasInterviews) { this.hasInterviews = hasInterviews; }
    
    public String getCandidateName() {
        return candidateName;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }
	public String getApplicationResumePath() {
		return applicationResumePath;
	}
	public void setApplicationResumePath(String applicationResumePath) {
		this.applicationResumePath = applicationResumePath;
	}
	public String getApplicationResumeUrl() {
		return applicationResumeUrl;
	}
	public void setApplicationResumeUrl(String applicationResumeUrl) {
		this.applicationResumeUrl = applicationResumeUrl;
	}
//	public boolean isUseMasterResume() {
//		return useMasterResume;
//	}
//	public void setUseMasterResume(boolean useMasterResume) {
//		this.useMasterResume = useMasterResume;
//	}
	
}
