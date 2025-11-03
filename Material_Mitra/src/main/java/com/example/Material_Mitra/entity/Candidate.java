package com.example.Material_Mitra.entity;

import java.time.LocalDate;
import java.util.List;

import com.example.Material_Mitra.enums.ResultStatus;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    @Column(unique = true)
    private String email;

    @Column(unique = true, nullable = false)
    private String phone;

    private LocalDate updatedAt;
    
    private String experience;
    private String noticePeriod;
    private String currentCtc;
    private String expectedCtc;
    private String location;
    private String skills;

    @Column(name = "resume_path", length = 500)
    private String resumePath;

    @Enumerated(EnumType.STRING)
    @Column(length = 100)
    private ResultStatus status;
    
  

    
    
    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL, orphanRemoval = true,fetch = FetchType.EAGER)
    @JsonManagedReference("candidate-applications")
    private List<JobApplication> applications;

    private String about;
    
    // Getters and Setters

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
	public LocalDate getUpdatedAt() {
		return updatedAt;
	}
	public void setUpdatedAt(LocalDate updatedAt) {
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
	public String getResumePath() {
		return resumePath;
	}
	public void setResumePath(String resumePath) {
		this.resumePath = resumePath;
	}
	public ResultStatus getStatus() {
		return status;
	}
	public void setStatus(ResultStatus status) {
		this.status = status;
	}
	public List<JobApplication> getApplications() {
		return applications;
	}
	public void setApplications(List<JobApplication> applications) {
		this.applications = applications;
	}
	public String getAbout() {
		return about;
	}
	public void setAbout(String about) {
		this.about = about;
	}
	
	

    
    

  }
