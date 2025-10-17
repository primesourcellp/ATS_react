package com.example.Material_Mitra.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.example.Material_Mitra.enums.WebsiteReviewed;
import com.example.Material_Mitra.enums.WorkingStatus;
import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
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
import jakarta.persistence.Table;

@Entity
@Table(name = "WebsiteApplicationForm")
public class WebsiteApplicationForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String applierName;

    @Column(nullable = false)
    private String email;

    private String phoneNumber;
    private String currentLocation;
    private Double currentCtc;
    private String workingCompanyName;
    private String workRole;
    private Double totalExperience;
    private String skills; 
    private String resumePath; 
    private LocalDateTime appliedAt = LocalDateTime.now();
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkingStatus currentlyWorking;

    // 🔗 Link to Job
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "job_id", nullable = false)
//    @JsonIgnoreProperties({"applications", "applicationForms"})
    @JsonBackReference
    private Job job;

    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false,length = 20)
    private WebsiteReviewed status = WebsiteReviewed.NOTVIEWED;
    
    // 🔗 Relationship to Notifications (using relatedEntityId as reference)
    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "relatedEntityId", referencedColumnName = "id")
    private List<Notification> notifications;
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

  

    public WorkingStatus getCurrentlyWorking() {
		return currentlyWorking;
	}
	public void setCurrentlyWorking(WorkingStatus currentlyWorking) {
		this.currentlyWorking = currentlyWorking;
	}
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

    public Job getJob() { return job; } 
    public void setJob(Job job) { this.job = job; }
	public WebsiteReviewed getStatus() {
		return status;
	}
	public void setStatus(WebsiteReviewed status) {
		this.status = status;
	}
	
	public List<Notification> getNotifications() {
		return notifications;
	}
	
	public void setNotifications(List<Notification> notifications) {
		this.notifications = notifications;
	}
}
