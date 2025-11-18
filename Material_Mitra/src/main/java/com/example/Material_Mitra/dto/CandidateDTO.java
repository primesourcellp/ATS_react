package com.example.Material_Mitra.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CandidateDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String experience;
    private String noticePeriod;
    private String currentCtc;
    private String expectedCtc;
    private String location;
    private String skills;
    private String about;
    private String resumePath;
    private String resumeUrl; 
 // Embedded Job details
    private String jobName;
    private String jobLocation;
    private List<JobApplicationDTO> applications;
    private boolean hasResume;
    private boolean hasApplications;
    private int jobCount;
    private List<String> appliedJobs;
    private List<AppliedJobInfo> appliedJobsWithClient;
    private Long createdById;
    private String createdByUsername;
    private String createdByEmail;

    public boolean isHasResume() {
        return hasResume;
    }
    public void setHasResume(boolean hasResume) {
        this.hasResume = hasResume;
    }
    
    public boolean isHasApplications() {
        return hasApplications;
    }
    public void setHasApplications(boolean hasApplications) {
        this.hasApplications = hasApplications;
    }
    
    public int getJobCount() {
        return jobCount;
    }
    public void setJobCount(int jobCount) {
        this.jobCount = jobCount;
    }
    
    public List<String> getAppliedJobs() {
        return appliedJobs;
    }
    public void setAppliedJobs(List<String> appliedJobs) {
        this.appliedJobs = appliedJobs;
    }
    
    public List<AppliedJobInfo> getAppliedJobsWithClient() {
        return appliedJobsWithClient;
    }
    public void setAppliedJobsWithClient(List<AppliedJobInfo> appliedJobsWithClient) {
        this.appliedJobsWithClient = appliedJobsWithClient;
    }

	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getPhone() {
		return phone;
	}
	public void setPhone(String phone) {
		this.phone = phone;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
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
	public String getExperience() {
		return experience;
	}
	public void setExperience(String experience) {
		this.experience = experience;
	}
	public String getNoticePeriod() {
		return noticePeriod;
	}
	public void setNoticePeriod(String noticePeriod) {
		this.noticePeriod = noticePeriod;
	}
	public String getCurrentCtc() {
		return currentCtc;
	}
	public void setCurrentCtc(String currentCtc) {
		this.currentCtc = currentCtc;
	}
	public String getExpectedCtc() {
		return expectedCtc;
	}
	public void setExpectedCtc(String expectedCtc) {
		this.expectedCtc = expectedCtc;
	}
	public String getLocation() {
		return location;
	}
	public void setLocation(String location) {
		this.location = location;
	}
	public String getSkills() {
		return skills;
	}
	public void setSkills(String skills) {
		this.skills = skills;
	}
	public List<JobApplicationDTO> getApplications() {
		return applications;
	}
	public void setApplications(List<JobApplicationDTO> applications) {
		this.applications = applications;
	}
	public String getAbout() {
		return about;
	}
	public void setAbout(String about) {
		this.about = about;
	}
	public String getResumePath() {
		return resumePath;
	}
	public void setResumePath(String resumePath) {
		this.resumePath = resumePath;
	}
	public String getResumeUrl() {
		return resumeUrl;
	}
	public void setResumeUrl(String resumeUrl) {
		this.resumeUrl = resumeUrl;
	}
	public String getJobName() {
		return jobName;
	}
	public void setJobName(String jobName) {
		this.jobName = jobName;
	}
	public String getJobLocation() {
		return jobLocation;
	}
	public void setJobLocation(String jobLocation) {
		this.jobLocation = jobLocation;
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

    // ✅ Getters
  
}
