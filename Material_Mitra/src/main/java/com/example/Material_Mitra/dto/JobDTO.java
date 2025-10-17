package com.example.Material_Mitra.dto;

public class JobDTO {
    private Long id;
    private String jobName;
    private String jobLocation;
    private String createdAt;
    private String skillsName;
    private String jobDescription;
    private ClientDTO client; // nested DTO
 // JobDTO.java
    private String status;  // add this
    private String jobType;
    private String jobExperience;
    private String jobSalaryRange;
    private boolean hasApplications; 

    // getter/setter
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getJobName() { return jobName; }
    public void setJobName(String jobName) { this.jobName = jobName; }

    public String getJobLocation() { return jobLocation; }
    public void setJobLocation(String jobLocation) { this.jobLocation = jobLocation; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getSkillsName() { return skillsName; }
    public void setSkillsName(String skillsName) { this.skillsName = skillsName; }

    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public ClientDTO getClient() { return client; }
    public void setClient(ClientDTO client) { this.client = client; }
	public String getJobType() {
		return jobType;
	}
	public void setJobType(String jobType) {
		this.jobType = jobType;
	}
    
    public boolean isHasApplications() { return hasApplications; }
    public void setHasApplications(boolean hasApplications) { this.hasApplications = hasApplications; }
    
    public String getJobExperience() { return jobExperience; }
    public void setJobExperience(String jobExperience) { this.jobExperience = jobExperience; }
    
    public String getJobSalaryRange() { return jobSalaryRange; }
    public void setJobSalaryRange(String jobSalaryRange) { this.jobSalaryRange = jobSalaryRange; }
    
}
