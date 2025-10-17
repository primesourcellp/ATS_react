package com.example.Material_Mitra.service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.Material_Mitra.dto.DTOMapper;
import com.example.Material_Mitra.dto.JobApplicationDTO;
import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.enums.ResultStatus;
import com.example.Material_Mitra.repository.CandidateRepository;
import com.example.Material_Mitra.repository.JobApplicationRepository;
import com.example.Material_Mitra.repository.JobRepository;

@Service
public class JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final CandidateRepository candidateRepository;
    private final JobRepository jobRepository;
    private final FileStorageService fileStorageService;

    public JobApplicationService(JobApplicationRepository jobApplicationRepository,
                                 CandidateRepository candidateRepository,
                                 JobRepository jobRepository,
                                 FileStorageService fileStorageService) {
        this.jobApplicationRepository = jobApplicationRepository;
        this.candidateRepository = candidateRepository;
        this.jobRepository = jobRepository;
        this.fileStorageService = fileStorageService;
    }

    // ✅ Apply for job
    public JobApplication createApplication(Long candidateId, Long jobId,
                                            ResultStatus status,
                                            MultipartFile resumeFile,
                                            boolean useMasterResume) throws IOException {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        JobApplication app = new JobApplication();
        app.setCandidate(candidate);
        app.setJob(job);
        app.setStatus(status != null ? status : ResultStatus.SCHEDULED);
        app.setAppliedAt(LocalDate.now());
        app.setCandidateName(candidate.getName());

        if (resumeFile != null && !resumeFile.isEmpty()) {
            String resumePath = fileStorageService.storeFile(resumeFile, "resumes/applications");
            app.setApplicationResumePath(resumePath);
            app.setUseMasterResume(false);
        } else if (useMasterResume && candidate.getResumePath() != null) {
            app.setApplicationResumePath(candidate.getResumePath());
            app.setUseMasterResume(true);
        }

        return jobApplicationRepository.save(app);
    }

    // ✅ Get all
    public List<JobApplicationDTO> getAllApplications() {
        return jobApplicationRepository.findAll()
                .stream().map(DTOMapper::toJobApplicationDTO)
                .collect(Collectors.toList());
    }

    // ✅ Get one
    public JobApplicationDTO getApplicationById(Long id) {
        JobApplication app = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        return DTOMapper.toJobApplicationDTO(app);
    }

    // ✅ Update
    public JobApplication updateApplication(Long id, ResultStatus status,
                                            MultipartFile resumeFile) throws IOException {
        JobApplication app = jobApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (status != null) app.setStatus(status);
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
}
