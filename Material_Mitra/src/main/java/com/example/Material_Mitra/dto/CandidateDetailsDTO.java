package com.example.Material_Mitra.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CandidateDetailsDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String status;
    private String resumePath;
    private String resumeUrl;
    private LocalDateTime updatedAt;
    private JobDTO jobDTO;

    private List<JobDTO> jobs; // ✔️ This replaced individual jobName/jobLocation
    private LocalDateTime createdAt;
    private Long createdById;
    private String createdByUsername;
    private String createdByEmail;

    // Job Info
//    private String jobName;
//    private String jobLocation;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResumePath() { return resumePath; }
    public void setResumePath(String resumePath) { this.resumePath = resumePath; }
    public String getResumeUrl() { return resumeUrl; }
    public void setResumeUrl(String resumeUrl) { this.resumeUrl = resumeUrl; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

//    public String getJobName() { return jobName; }
//    public void setJobName(String jobName) { this.jobName = jobName; }
//
//    public String getJobLocation() { return jobLocation; }
//    public void setJobLocation(String jobLocation) { this.jobLocation = jobLocation; }
//	public JobDTO getJobDTO() {
//		return jobDTO;
//	}
	public void setJobDTO(JobDTO jobDTO) {
		this.jobDTO = jobDTO;
	}
	public List<JobDTO> getJobs() {
		return jobs;
	}
	public void setJobs(List<JobDTO> jobs) {
		this.jobs = jobs;
	}
	public JobDTO getJobDTO() {
		return jobDTO;
	}
	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
	public Long getCreatedById() {
		return createdById;
	}
	public void setCreatedById(Long createdById) {
		this.createdById = createdById;
	}
	public String getCreatedByUsername() {
		return createdByUsername;
	}
	public void setCreatedByUsername(String createdByUsername) {
		this.createdByUsername = createdByUsername;
	}
	public String getCreatedByEmail() {
		return createdByEmail;
	}
	public void setCreatedByEmail(String createdByEmail) {
		this.createdByEmail = createdByEmail;
	}
    
}

