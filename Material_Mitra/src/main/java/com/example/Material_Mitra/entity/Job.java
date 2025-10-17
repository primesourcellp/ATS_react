package com.example.Material_Mitra.entity;

import java.time.LocalDate;
import java.util.List;

import com.example.Material_Mitra.enums.JobStatus;
import com.example.Material_Mitra.enums.JobType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;

@Entity
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String jobName;	
    private String jobLocation;
    private LocalDate createdAt;
    private String skillsname;
    private String jobDiscription;
    private String jobExperience;
    private String jobSalaryRange;

    @Enumerated(EnumType.STRING)
    private JobStatus status; // no default



    @Enumerated(EnumType.STRING)
    private JobType jobType;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference("job-applications")
//    @JsonIgnore
    private List<JobApplication> applications;
    
    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<WebsiteApplicationForm>applicationForms;

    
//    
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "client_id")
////    @JsonIgnore // Avoid infinite recursion during JSON serialization
//    @JsonIgnoreProperties({"jobs"})
//    private Client client;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "client_id")
    @JsonIgnoreProperties({"jobs"})
    private Client client;

    
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
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
	public LocalDate getCreatedAt() {
		return createdAt;
	}
	public void setCreatedAt(LocalDate createdAt) {
		this.createdAt = createdAt;
	}
	public String getSkillsname() {
		return skillsname;
	}
	public void setSkillsname(String skillsname) {
		this.skillsname = skillsname;
	}
	public String getJobDiscription() {
		return jobDiscription;
	}
	public void setJobDiscription(String jobDiscription) {
		this.jobDiscription = jobDiscription;
	}
	public List<JobApplication> getApplications() {
		return applications;
	}

	public void setApplications(List<JobApplication> applications) {
		this.applications = applications;
	}
	public Client getClient() {
		return client;
	}
	public void setClient(Client client) {
		this.client = client;
	}
	public JobStatus getStatus() {
		return status;
	}
	public void setStatus(JobStatus status) {
		this.status = status;
	}
	public JobType getJobType() {
		return jobType;
	}
	public void setJobType(JobType jobType) {
		this.jobType = jobType;
	}
	public List<WebsiteApplicationForm> getApplicationForms() {
		return applicationForms;
	}
	public void setApplicationForms(List<WebsiteApplicationForm> applicationForms) {
		this.applicationForms = applicationForms;
	}
//	public String jobSalaryRange() {
//		return jobExperience;
//	}
	public void setJobExperience(String jobExperience) {
		this.jobExperience = jobExperience;
	}
	public String getJobSalaryRange() {
		return jobSalaryRange;
	}
	public void setJobSalaryRange(String jobSalaryRange) {
		this.jobSalaryRange = jobSalaryRange;
	}
	public String getJobExperience() {
		return jobExperience;
	} 
	
	
}
