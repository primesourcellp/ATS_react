package com.example.Material_Mitra.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

import com.example.Material_Mitra.dto.DTOMapper;
import com.example.Material_Mitra.dto.JobApplicationDTO;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.enums.ResultStatus;
import com.example.Material_Mitra.service.FileStorageService;
import com.example.Material_Mitra.service.JobApplicationService;

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
    @PostMapping("/apply/{candidateId}/job/{jobId}")
    public ResponseEntity<JobApplicationDTO> applyForJob(
            @PathVariable Long candidateId,
            @PathVariable Long jobId,
            @RequestParam(defaultValue = "SCHEDULED") String status,
            @RequestParam(required = false) MultipartFile resumeFile,
            @RequestParam(defaultValue = "false") boolean useMasterResume) throws IOException {

        JobApplication app = jobApplicationService.createApplication(
                candidateId, jobId,
                ResultStatus.valueOf(status.toUpperCase()),
                resumeFile, useMasterResume);

        return ResponseEntity.ok(DTOMapper.toJobApplicationDTO(app));
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
    public ResponseEntity<JobApplicationDTO> updateApplication(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) MultipartFile resumeFile) throws IOException {

        ResultStatus resultStatus = status != null ? ResultStatus.valueOf(status.toUpperCase()) : null;
        JobApplication app = jobApplicationService.updateApplication(id, resultStatus, resumeFile);
        return ResponseEntity.ok(DTOMapper.toJobApplicationDTO(app));
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
                return ResponseEntity.badRequest().body("Resume file is required");
            }
            
            jobApplicationService.updateApplicationResume(id, resumeFile);
            return ResponseEntity.ok().body(Map.of(
                "message", "Resume updated successfully for application ID: " + id,
                "applicationId", id
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Failed to upload resume: " + e.getMessage());
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
    public ResponseEntity<Resource> getApplicationResumeFile(@PathVariable Long id) {
        try {
            String resumePath = jobApplicationService.getResumePath(id);
            if (resumePath == null) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = fileStorageService.loadFileAsResource(resumePath);
            String contentType = fileStorageService.getContentType(resumePath);
            if (contentType == null) {
                contentType = "application/pdf";
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"application_resume.pdf\"")
                    .body(resource);
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
