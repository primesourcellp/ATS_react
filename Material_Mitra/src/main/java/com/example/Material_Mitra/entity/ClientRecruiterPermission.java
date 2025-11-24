package com.example.Material_Mitra.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ClientRecruiterPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnore
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recruiter_id", nullable = false)
    private User recruiter;

    /**
     * Per-client equivalent of \"Only my clients\".
     * When true, this recruiter can see this client when restrictions are enabled.
     */
    @Column(nullable = false)
    private boolean canViewClient = true;

    /**
     * Per-client equivalent of \"Only my clients' jobs\".
     * When true, this recruiter can see this client's jobs when restrictions are enabled.
     */
    @Column(nullable = false)
    private boolean canViewJobs = true;

    /**
     * Per-client equivalent of \"Only my clients' candidates\".
     * When true, this recruiter can see candidates/applications
     * for this client's jobs when restrictions are enabled.
     */
    @Column(nullable = false)
    private boolean canViewCandidates = true;

    /**
     * Per-client equivalent of \"Only my clients' interviews\".
     * When true, this recruiter can see interviews for this
     * client's jobs when restrictions are enabled.
     */
    @Column(nullable = false)
    private boolean canViewInterviews = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public User getRecruiter() {
        return recruiter;
    }

    public void setRecruiter(User recruiter) {
        this.recruiter = recruiter;
    }

    public boolean isCanViewClient() {
        return canViewClient;
    }

    public void setCanViewClient(boolean canViewClient) {
        this.canViewClient = canViewClient;
    }

    public boolean isCanViewJobs() {
        return canViewJobs;
    }

    public void setCanViewJobs(boolean canViewJobs) {
        this.canViewJobs = canViewJobs;
    }

    public boolean isCanViewCandidates() {
        return canViewCandidates;
    }

    public void setCanViewCandidates(boolean canViewCandidates) {
        this.canViewCandidates = canViewCandidates;
    }

    public boolean isCanViewInterviews() {
        return canViewInterviews;
    }

    public void setCanViewInterviews(boolean canViewInterviews) {
        this.canViewInterviews = canViewInterviews;
    }
}


