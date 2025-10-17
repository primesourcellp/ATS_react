package com.example.Material_Mitra.entity;

import java.time.LocalDate;
import java.util.List;

import com.example.Material_Mitra.enums.ResultStatus;
import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.CascadeType;
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

@Entity
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

   
    
    
    @ManyToOne
    @JoinColumn(name = "candidate_id", nullable = false)
    @JsonBackReference("candidate-applications")
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "job_id", nullable = false )
    @JsonBackReference("job-applications")
    private Job job;


    @Column(name = "resume_path", length = 500)
    private String applicationResumePath;	

    @Enumerated(EnumType.STRING)
    private ResultStatus status;

    private LocalDate appliedAt;
    @Column(name = "candidate_name")
    private String candidateName;
    @Column(name = "use_master_resume")
    private Boolean useMasterResume = true;
    
    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Interview> interviews;


	public Long getId() {
		return id;
	}


	public void setId(Long id) {
		this.id = id;
	}


	public Candidate getCandidate() {
		return candidate;
	}


	public void setCandidate(Candidate candidate) {
		this.candidate = candidate;
	}

	public Job getJob() {
		return job;
	}

	public void setJob(Job job) {
		this.job = job;
	}



	public String getApplicationResumePath() {
		return applicationResumePath;
	}

	public void setApplicationResumePath(String applicationResumePath) {
		this.applicationResumePath = applicationResumePath;
	}


	public ResultStatus getStatus() {
		return status;
	}


	public void setStatus(ResultStatus status) {
		this.status = status;
	}


	public LocalDate getAppliedAt() {
		return appliedAt;
	}


	public void setAppliedAt(LocalDate appliedAt) {
		this.appliedAt = appliedAt;
	}


	public String getCandidateName() {
		return candidateName;
	}


	public void setCandidateName(String candidateName) {
		this.candidateName = candidateName;
	}


	public List<Interview> getInterviews() {
		return interviews;
	}


	public void setInterviews(List<Interview> interviews) {
		this.interviews = interviews;
	}

	public Boolean getUseMasterResume() {
	    return useMasterResume;
	}

	public void setUseMasterResume(Boolean useMasterResume) {
	    this.useMasterResume = useMasterResume != null ? useMasterResume : false;
	}


    // Getters and Setters

	
    
    
    
    
}
