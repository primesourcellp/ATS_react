package com.example.Material_Mitra.entity;

import com.example.Material_Mitra.enums.RoleStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String email;

    @Enumerated(EnumType.STRING)
    private RoleStatus role;

    /**
     * When true, recruiter sees only clients assigned to them.
     * Default: false (see all clients).
     */
    @Column(nullable = false)
    private boolean restrictClients = false;

    /**
     * Legacy DB column kept for backward compatibility.
     * Mirrors restrictClients to satisfy existing NOT NULL column
     * 'restricted_client_access'.
     */
    @Column(name = "restricted_client_access", nullable = false)
    private boolean restrictedClientAccess = false;

    /**
     * When true, recruiter sees only jobs whose client is assigned to them.
     * Default: false (see all jobs).
     */
    @Column(nullable = false)
    private boolean restrictJobs = false;

    /**
     * When true, recruiter sees only candidates/applications
     * for jobs whose client is assigned to them.
     * Default: false (see all candidates).
     */
    @Column(nullable = false)
    private boolean restrictCandidates = false;

    /**
     * Legacy DB column kept for backward compatibility.
     * Mirrors restrictCandidates to satisfy existing NOT NULL column
     * 'restricted_candidate_access'.
     */
    @Column(name = "restricted_candidate_access", nullable = false)
    private boolean restrictedCandidateAccess = false;

    /**
     * When true, recruiter sees only interviews whose job's client
     * is assigned to them (via per-client permissions).
     */
    @Column(nullable = false)
    private boolean restrictInterviews = false;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public RoleStatus getRole() {
        return role;
    }

    public void setRole(RoleStatus role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isRestrictClients() {
        return restrictClients;
    }

    public void setRestrictClients(boolean restrictClients) {
        this.restrictClients = restrictClients;
        // keep legacy column in sync
        this.restrictedClientAccess = restrictClients;
    }

    public boolean isRestrictedClientAccess() {
        return restrictedClientAccess;
    }

    public void setRestrictedClientAccess(boolean restrictedClientAccess) {
        this.restrictedClientAccess = restrictedClientAccess;
        // keep new flag in sync as well
        this.restrictClients = restrictedClientAccess;
    }

    public boolean isRestrictJobs() {
        return restrictJobs;
    }

    public void setRestrictJobs(boolean restrictJobs) {
        this.restrictJobs = restrictJobs;
    }

    public boolean isRestrictCandidates() {
        return restrictCandidates;
    }

    public void setRestrictCandidates(boolean restrictCandidates) {
        this.restrictCandidates = restrictCandidates;
        // keep legacy column in sync
        this.restrictedCandidateAccess = restrictCandidates;
    }

    public boolean isRestrictedCandidateAccess() {
        return restrictedCandidateAccess;
    }

    public void setRestrictedCandidateAccess(boolean restrictedCandidateAccess) {
        this.restrictedCandidateAccess = restrictedCandidateAccess;
        // keep new flag in sync as well
        this.restrictCandidates = restrictedCandidateAccess;
    }

    public boolean isRestrictInterviews() {
        return restrictInterviews;
    }

    public void setRestrictInterviews(boolean restrictInterviews) {
        this.restrictInterviews = restrictInterviews;
    }
}
