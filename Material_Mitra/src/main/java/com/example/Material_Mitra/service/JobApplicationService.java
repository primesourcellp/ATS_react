package com.example.Material_Mitra.service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.Material_Mitra.dto.DTOMapper;
import com.example.Material_Mitra.dto.JobApplicationDTO;
import com.example.Material_Mitra.entity.ApplicationStatusHistory;
import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.enums.ResultStatus;
import com.example.Material_Mitra.repository.ApplicationStatusHistoryRepository;
import com.example.Material_Mitra.repository.CandidateRepository;
import com.example.Material_Mitra.repository.JobApplicationRepository;
import com.example.Material_Mitra.repository.JobRepository;
import com.example.Material_Mitra.repository.UserRepository;

@Service
public class JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    // private final S3FileStorageService fileStorageService; // AWS S3 - COMMENTED OUT
    private final FileStorageService fileStorageService; // Using local file storage instead
    private final UserRepository userRepository;
    private final ApplicationStatusHistoryRepository statusHistoryRepository;

    public JobApplicationService(JobApplicationRepository jobApplicationRepository,
                                 CandidateRepository candidateRepository,
                                 JobRepository jobRepository,
                                 FileStorageService fileStorageService,
                                 UserRepository userRepository,
                                 ApplicationStatusHistoryRepository statusHistoryRepository) {
        this.jobApplicationRepository = jobApplicationRepository;
        this.candidateRepository = candidateRepository;
        this.jobRepository = jobRepository;
        this.fileStorageService = fileStorageService;
        this.userRepository = userRepository;
        this.statusHistoryRepository = statusHistoryRepository;
    }

    // ✅ Apply for job
    public JobApplication createApplication(Long candidateId, Long jobId,
                                            ResultStatus status,
                                            String statusDescription,
                                            MultipartFile resumeFile,
                                            boolean useMasterResume) throws IOException {
        if (jobApplicationRepository.existsByCandidateIdAndJobId(candidateId, jobId)) {
            throw new IllegalStateException("Candidate is already assigned to this job.");
        }

        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        JobApplication app = new JobApplication();
        app.setCandidate(candidate);
        app.setJob(job);
        app.setStatus(status != null ? status : ResultStatus.NEW_CANDIDATE);
        app.setAppliedAt(LocalDate.now());
        app.setCandidateName(candidate.getName());
        resolveCurrentUser().ifPresent(user -> {
            app.setCreatedBy(user);
            app.setCreatedByUserId(user.getId());
            app.setCreatedByName(user.getUsername());
            app.setCreatedByEmail(user.getEmail());
        });
        if (app.getCreatedBy() != null) {
            if (app.getCreatedByUserId() == null) {
                app.setCreatedByUserId(app.getCreatedBy().getId());
            }
            if (app.getCreatedByName() == null || app.getCreatedByName().isBlank()) {
                app.setCreatedByName(app.getCreatedBy().getUsername());
            }
            if (app.getCreatedByEmail() == null || app.getCreatedByEmail().isBlank()) {
                app.setCreatedByEmail(app.getCreatedBy().getEmail());
            }
        }
        if (app.getCreatedByName() == null) {
            app.setCreatedByName(candidate.getCreatedByName());
        }
        if (app.getCreatedByEmail() == null) {
            app.setCreatedByEmail(candidate.getCreatedByEmail());
        }

        if (resumeFile != null && !resumeFile.isEmpty()) {
            String resumePath = fileStorageService.storeFile(resumeFile, "resumes/applications");
            app.setApplicationResumePath(resumePath);
            app.setUseMasterResume(false);
        } else if (useMasterResume && candidate.getResumePath() != null) {
            app.setApplicationResumePath(candidate.getResumePath());
            app.setUseMasterResume(true);
        }

        JobApplication savedApp = jobApplicationRepository.save(app);
        
        // Create initial status history entry
        createStatusHistory(savedApp, status, statusDescription);
        
        return savedApp;
    }

    // ✅ Get all (with recruiter restriction based on assigned clients)
    public List<JobApplicationDTO> getAllApplications() {
        User current = resolveCurrentUser().orElse(null);

        // Admin / Secondary admin or unrestricted -> see all applications
        if (current == null ||
            current.getRole() == null ||
            current.getRole() == com.example.Material_Mitra.enums.RoleStatus.ADMIN ||
            current.getRole() == com.example.Material_Mitra.enums.RoleStatus.SECONDARY_ADMIN ||
            !current.isRestrictCandidates()) {

            return jobApplicationRepository.findAll()
                    .stream()
                    .map(DTOMapper::toJobApplicationDTO)
                    .collect(Collectors.toList());
        }

        // Restricted recruiter: only applications for jobs whose client is assigned to them
        return jobApplicationRepository.findApplicationsByAssignedRecruiter(current.getId())
                .stream()
                .map(DTOMapper::toJobApplicationDTO)
                .collect(Collectors.toList());
    }

    // ✅ Get one
    @Transactional
    public JobApplicationDTO getApplicationById(Long id) {
        JobApplication app = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        
        // Fetch status history separately to avoid lazy loading issues
        List<ApplicationStatusHistory> history = statusHistoryRepository.findByApplicationIdOrderByChangedAtDesc(id);
        if (history != null && !history.isEmpty()) {
            history.forEach(h -> h.setApplication(app));
            List<ApplicationStatusHistory> existing = app.getStatusHistory();
            if (existing == null) {
                existing = new ArrayList<>();
                app.setStatusHistory(existing);
            } else {
                existing.clear();
            }
            existing.addAll(history);
        }
        
        // Ensure interviews are loaded (they should be eager, but just in case)
        if (app.getInterviews() != null) {
            app.getInterviews().size(); // Force lazy loading
        }
        
        return DTOMapper.toJobApplicationDTO(app);
    }

    // ✅ Update
    public JobApplication updateApplication(Long id, ResultStatus status,
                                            String statusDescription,
                                            MultipartFile resumeFile) throws IOException {
        JobApplication app = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        // Check if current user is the one who assigned the job or is an admin
        if (status != null) {
            Optional<User> currentUserOpt = resolveCurrentUser();
            if (currentUserOpt.isPresent()) {
                User currentUser = currentUserOpt.get();
                String currentUsername = currentUser.getUsername();
                String assignedByUsername = app.getCreatedByName() != null ? app.getCreatedByName() : 
                    (app.getCreatedBy() != null ? app.getCreatedBy().getUsername() : null);
                
                // Allow if user is admin or secondary admin, or if they assigned the job
                boolean isAdmin = currentUser.getRole() == com.example.Material_Mitra.enums.RoleStatus.ADMIN ||
                                  currentUser.getRole() == com.example.Material_Mitra.enums.RoleStatus.SECONDARY_ADMIN;
                boolean isAssignedByUser = assignedByUsername != null && 
                                          assignedByUsername.trim().equalsIgnoreCase(currentUsername.trim());
                
                if (!isAdmin && !isAssignedByUser) {
                    throw new RuntimeException("Only the user who assigned this job to the candidate can change the application status.");
                }
            }
        }

        ResultStatus oldStatus = app.getStatus();
        if (status != null && status != oldStatus) {
            app.setStatus(status);
            // Create status history entry when status changes
            createStatusHistory(app, status, statusDescription);
        }
        if (resumeFile != null && !resumeFile.isEmpty()) {
            // Delete old resume if exists
            if (app.getApplicationResumePath() != null) {
                fileStorageService.deleteFile(app.getApplicationResumePath());
            }
            // Store new resume
            String resumePath = fileStorageService.storeFile(resumeFile, "resumes/applications");
            app.setApplicationResumePath(resumePath);
            app.setUseMasterResume(false);
        }

        return jobApplicationRepository.save(app);
    }

    // ✅ Delete
    public void deleteApplication(Long id) {
        JobApplication app = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        
        // Check if current user is the one who assigned the job
        Optional<User> currentUserOpt = resolveCurrentUser();
        if (currentUserOpt.isPresent()) {
            User currentUser = currentUserOpt.get();
            String currentUsername = currentUser.getUsername();
            String assignedByUsername = app.getCreatedByName() != null ? app.getCreatedByName() : 
                (app.getCreatedBy() != null ? app.getCreatedBy().getUsername() : null);
            
                // Allow if user is admin or secondary admin, or if they assigned the job
                boolean isAdmin = currentUser.getRole() == com.example.Material_Mitra.enums.RoleStatus.ADMIN ||
                                  currentUser.getRole() == com.example.Material_Mitra.enums.RoleStatus.SECONDARY_ADMIN;
                boolean isAssignedByUser = assignedByUsername != null && 
                                          assignedByUsername.trim().equalsIgnoreCase(currentUsername.trim());
                
                if (!isAdmin && !isAssignedByUser) {
                    throw new RuntimeException("Only the user who assigned this job to the candidate can delete the application.");
                }
        }
        
        // Check if application has interviews
        if (app.getInterviews() != null && !app.getInterviews().isEmpty()) {
            throw new RuntimeException("Cannot delete application with existing interviews. Please delete interviews first.");
        }
        
        // Remove the application from candidate's applications list
        if (app.getCandidate() != null && app.getCandidate().getApplications() != null) {
            app.getCandidate().getApplications().remove(app);
        }
        
        // Remove the application from job's applications list
        if (app.getJob() != null && app.getJob().getApplications() != null) {
            app.getJob().getApplications().remove(app);
        }
        
        // Delete the application
        jobApplicationRepository.delete(app);
    }

    // ✅ Check if application has interviews
    public boolean hasInterviews(Long id) {
        JobApplication app = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        
        return app.getInterviews() != null && !app.getInterviews().isEmpty();
    }

    // ✅ Resume Download - Returns file path instead of bytes
    public String getResumePath(Long id) {
        JobApplication app = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        
        // Priority 1: If custom resume is uploaded, use it
        if (app.getApplicationResumePath() != null && !app.getApplicationResumePath().isEmpty()) {
            return app.getApplicationResumePath();
        }
        
        // Priority 2: If no custom resume, use candidate's master resume
        Candidate candidate = candidateRepository.findById(app.getCandidate().getId())
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        return candidate.getResumePath();
    }

    // ✅ Update Application Resume - Upload new resume for specific application
    public void updateApplicationResume(Long id, MultipartFile resumeFile) throws IOException {
        JobApplication app = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        
        // Store the new resume file
        String resumePath = fileStorageService.storeFile(resumeFile, "resumes/applications");
        app.setApplicationResumePath(resumePath);
        
        // Keep useMasterResume flag as is - it's only for display purposes
        // The actual resume fetching logic will prioritize custom resume over master resume
        
        jobApplicationRepository.save(app);
    }

    // ✅ Toggle Master Resume Usage - Switch between master resume and custom resume
    public void toggleMasterResume(Long id, boolean useMaster) {
        JobApplication app = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        
        app.setUseMasterResume(useMaster);
        
        // If switching to master resume, clear the custom resume path
        // This will make the system use the master resume
        if (useMaster) {
            app.setApplicationResumePath(null);
        }
        
        jobApplicationRepository.save(app);
    }

    // ✅ Remove Custom Resume - Delete custom resume and switch back to master resume
    public void removeCustomResume(Long id) {
        JobApplication app = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        
        // Clear the custom resume path to switch back to master resume
        app.setApplicationResumePath(null);
        app.setUseMasterResume(true);
        
        jobApplicationRepository.save(app);
    }

    // ✅ Get total application count
    public long getApplicationCount() {
        return jobApplicationRepository.count();
    }

    private Optional<User> resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        String username = authentication.getName();
        if (username == null || "anonymousUser".equalsIgnoreCase(username)) {
            return Optional.empty();
        }
        return userRepository.findByUsername(username);
    }

    private void createStatusHistory(JobApplication application, ResultStatus status, String description) {
        ApplicationStatusHistory history = new ApplicationStatusHistory();
        history.setApplication(application);
        history.setStatus(status);
        history.setDescription(description != null && !description.isBlank() ? description : null);
        history.setChangedAt(LocalDateTime.now());
        
        resolveCurrentUser().ifPresent(user -> {
            history.setChangedBy(user);
            history.setChangedByUserId(user.getId());
            history.setChangedByName(user.getUsername());
            history.setChangedByEmail(user.getEmail());
        });
        
        statusHistoryRepository.save(history);
    }
}
