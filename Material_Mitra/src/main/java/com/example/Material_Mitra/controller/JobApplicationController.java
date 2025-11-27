package com.example.Material_Mitra.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.Material_Mitra.dto.DTOMapper;
import com.example.Material_Mitra.dto.JobApplicationDTO;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.enums.ResultStatus;
import com.example.Material_Mitra.service.FileStorageService;
import com.example.Material_Mitra.service.JobApplicationService; // Using local file storage instead

@RestController
@RequestMapping("/api/applications")
public class JobApplicationController {

    private final JobApplicationService jobApplicationService;
    private final FileStorageService fileStorageService;

    public JobApplicationController(JobApplicationService jobApplicationService, FileStorageService fileStorageService) {
        this.jobApplicationService = jobApplicationService;
        this.fileStorageService = fileStorageService;
    }

    // ✅ Apply for job
    @PostMapping(value = "/apply/{candidateId}/job/{jobId}")
    public ResponseEntity<?> applyForJob(
            @PathVariable Long candidateId,
            @PathVariable Long jobId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String statusDescription,
            @RequestParam(required = false) MultipartFile resumeFile,
            @RequestParam(required = false) Boolean useMasterResume) throws IOException {

        ResultStatus resultStatus;
        try {
            resultStatus = (status != null && !status.isBlank())
                    ? ResultStatus.valueOf(status.toUpperCase())
                    : ResultStatus.NEW_CANDIDATE;
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value: " + status);
        }

        Boolean resolvedUseMaster = useMasterResume;
        if (resolvedUseMaster == null) {
            resolvedUseMaster = Boolean.TRUE;
        }

        try {
            JobApplication app = jobApplicationService.createApplication(
                    candidateId, jobId,
                    resultStatus,
                    statusDescription,
                    resumeFile,
                    resolvedUseMaster);

            return ResponseEntity.ok(DTOMapper.toJobApplicationDTO(app));
        } catch (IllegalStateException duplicateEx) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", duplicateEx.getMessage()));
        } catch (RuntimeException e) {
            // Handle file validation errors (size, type) and other runtime exceptions
            if (e.getMessage() != null && (
                e.getMessage().contains("File size exceeds") ||
                e.getMessage().contains("Invalid file type") ||
                e.getMessage().contains("Failed to store")
            )) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", e.getMessage()));
            }
            // Re-throw other runtime exceptions
            throw e;
        }
    }

    // ✅ Get all
    @GetMapping
    public ResponseEntity<List<JobApplicationDTO>> getAllApplications() {
        return ResponseEntity.ok(jobApplicationService.getAllApplications());
    }

    // ✅ Get one
    @GetMapping("/{id}")
    public ResponseEntity<JobApplicationDTO> getApplication(@PathVariable Long id) {
        return ResponseEntity.ok(jobApplicationService.getApplicationById(id));
    }

    // ✅ Update status or resume
    @PutMapping("/{id}")
    public ResponseEntity<?> updateApplication(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String statusDescription,
            @RequestParam(required = false) MultipartFile resumeFile) throws IOException {

        try {
            ResultStatus resultStatus = status != null ? ResultStatus.valueOf(status.toUpperCase()) : null;
            JobApplication app = jobApplicationService.updateApplication(id, resultStatus, statusDescription, resumeFile);
            return ResponseEntity.ok(DTOMapper.toJobApplicationDTO(app));
        } catch (IllegalArgumentException e) {
            // Handle invalid status value
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid status value: " + status));
        } catch (RuntimeException e) {
            // Handle file validation errors (size, type) and other runtime exceptions
            if (e.getMessage() != null && (
                e.getMessage().contains("File size exceeds") ||
                e.getMessage().contains("Invalid file type") ||
                e.getMessage().contains("Failed to store")
            )) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", e.getMessage()));
            }
            // Re-throw other runtime exceptions
            throw e;
        }
    }

    // ✅ Delete
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteApplication(@PathVariable Long id) {
        try {
            jobApplicationService.deleteApplication(id);
            return ResponseEntity.ok("Application deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // ✅ Get Resume Path - Frontend will use /api/files/{fileName} to download
    @GetMapping("/{id}/resume/path")
    public ResponseEntity<?> getResumePath(@PathVariable Long id) {
        try {
            String resumePath = jobApplicationService.getResumePath(id);
            if (resumePath == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok().body(Map.of("resumePath", resumePath, "resumeUrl", "http://localhost:8080/api/files/" + resumePath));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // ✅ Get Resume View - Returns resume URL for frontend to use
    @GetMapping("/{id}/resume/view")
    public ResponseEntity<?> getResumeView(@PathVariable Long id) {
        try {
            String resumePath = jobApplicationService.getResumePath(id);
            if (resumePath == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Resume not found for application ID: " + id);
            }
            
            // Return the file path and URL for frontend to use
            return ResponseEntity.ok()
                    .body(Map.of(
                        "resumePath", resumePath,
                        "resumeUrl", "http://localhost:8080/api/files/" + resumePath,
                        "applicationId", id
                    ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // ✅ Update Resume for Application - Upload new resume for specific application
    @PutMapping("/{id}/resume")
    public ResponseEntity<?> updateApplicationResume(@PathVariable Long id, 
                                                   @RequestParam("resume") MultipartFile resumeFile) {
        try {
            if (resumeFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Resume file is required"));
            }
            
            jobApplicationService.updateApplicationResume(id, resumeFile);
            return ResponseEntity.ok().body(Map.of(
                "message", "Resume updated successfully for application ID: " + id,
                "applicationId", id
            ));
        } catch (RuntimeException e) {
            // Handle file validation errors (size, type) and other runtime exceptions
            if (e.getMessage() != null && (
                e.getMessage().contains("File size exceeds") ||
                e.getMessage().contains("Invalid file type") ||
                e.getMessage().contains("Failed to store")
            )) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", e.getMessage()));
            }
            // Handle not found errors
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", e.getMessage() != null ? e.getMessage() : "An error occurred"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to upload resume: " + e.getMessage()));
        }
    }

    // ✅ Toggle Master Resume Usage - Switch between master resume and custom resume
    @PutMapping("/{id}/resume/master")
    public ResponseEntity<?> toggleMasterResume(@PathVariable Long id, 
                                              @RequestParam("useMaster") boolean useMaster) {
        try {
            jobApplicationService.toggleMasterResume(id, useMaster);
            return ResponseEntity.ok().body(Map.of(
                "message", "Master resume setting updated for application ID: " + id,
                "useMasterResume", useMaster,
                "applicationId", id
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // ✅ Serve Application Resume File Content Directly (Proxy Endpoint)
    @GetMapping("/{id}/resume/file")
    public ResponseEntity<?> getApplicationResumeFile(@PathVariable Long id) {
        try {
            String resumePath = jobApplicationService.getResumePath(id);
            if (resumePath == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Return local file URL
            String presignedUrl = fileStorageService.getFileUrl(resumePath);
            
            return ResponseEntity.ok()
                    .body(Map.of(
                        "url", presignedUrl,
                        "fileName", "Application_Resume_" + id + ".pdf"
                    ));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ Remove Custom Resume - Delete custom resume and switch back to master resume
    @DeleteMapping("/{id}/resume")
    public ResponseEntity<?> removeCustomResume(@PathVariable Long id) {
        try {
            jobApplicationService.removeCustomResume(id);
            return ResponseEntity.ok().body(Map.of(
                "message", "Custom resume removed. Now using master resume for application ID: " + id,
                "applicationId", id,
                "useMasterResume", true
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // ✅ Check if application has interviews
    @GetMapping("/{id}/has-interviews")
    public ResponseEntity<?> hasInterviews(@PathVariable Long id) {
        try {
            boolean hasInterviews = jobApplicationService.hasInterviews(id);
            return ResponseEntity.ok().body(Map.of(
                "hasInterviews", hasInterviews,
                "applicationId", id
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // ✅ Get total application count
    @GetMapping("/count")
    public long getApplicationCount() {
        return jobApplicationService.getApplicationCount();
    }
}
