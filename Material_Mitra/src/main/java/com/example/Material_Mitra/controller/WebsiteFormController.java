package com.example.Material_Mitra.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.Material_Mitra.dto.WebsiteApplicationDTO;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.entity.Notification;
import com.example.Material_Mitra.entity.WebsiteApplicationForm;
import com.example.Material_Mitra.enums.WebsiteReviewed;
import com.example.Material_Mitra.enums.WorkingStatus;
import com.example.Material_Mitra.repository.JobRepository;
import com.example.Material_Mitra.service.NotificationService;
import com.example.Material_Mitra.service.S3FileStorageService;
import com.example.Material_Mitra.service.WebsiteFormService;

@RestController
@RequestMapping("/api/forms")
public class WebsiteFormController {

    private final WebsiteFormService formService;
    private final JobRepository jobRepository;
    private final NotificationService notificationService;
    private final S3FileStorageService fileStorageService;

    @Autowired
    public WebsiteFormController(WebsiteFormService formService, JobRepository jobRepository, 
                                 NotificationService notificationService, S3FileStorageService fileStorageService) {
        this.formService = formService;
        this.jobRepository = jobRepository;
        this.notificationService = notificationService;
        this.fileStorageService = fileStorageService;
    }

    // ✅ Return DTO instead of entity
    @PostMapping("/apply/{jobId}")
    public ResponseEntity<WebsiteApplicationDTO> applyForJob(
            @PathVariable Long jobId,
            @RequestParam String applierName,
            @RequestParam String email,
            @RequestParam String currentLocation,
            @RequestParam String phoneNumber,
            @RequestParam(required = false) Double currentCtc,
            @RequestParam WorkingStatus currentlyWorking,
            @RequestParam(required = false) String workingCompanyName,
            @RequestParam(required = false) String workRole,
            @RequestParam String experience,
            @RequestParam String skills,
            @RequestParam("resume") MultipartFile resumeFile
    ) throws IOException {

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        // Save resume to S3
        String resumePath = fileStorageService.storeFile(resumeFile, "resumes/website-applications");

        // Parse experience string to double
        Double experienceValue = 0.0;
        try {
            // Remove "years" and other text, keep only numbers
            String cleanExperience = experience.replaceAll("[^0-9.]", "");
            if (!cleanExperience.isEmpty()) {
                experienceValue = Double.parseDouble(cleanExperience);
            }
        } catch (NumberFormatException e) {
            // If parsing fails, default to 0.0
            experienceValue = 0.0;
        }

        // Build application entity
        WebsiteApplicationForm application = new WebsiteApplicationForm();
        application.setApplierName(applierName);
        application.setEmail(email);
        application.setPhoneNumber(phoneNumber);
        application.setCurrentlyWorking(currentlyWorking);
        application.setCurrentLocation(currentLocation);
        application.setTotalExperience(experienceValue);
        application.setSkills(skills);

        if (currentlyWorking == WorkingStatus.YES) {
            application.setCurrentCtc(currentCtc);
            application.setWorkingCompanyName(workingCompanyName);
            application.setWorkRole(workRole);
        } else {
            application.setCurrentCtc(0.0);
            application.setWorkingCompanyName("Currently Not Working");
            application.setWorkRole("Unemployed");
        }

        application.setResumePath(resumePath);  // Store the S3 key
        application.setJob(job);

        WebsiteApplicationForm saved = formService.save(application);

        // ✅ Create notification for new application
        try {
            System.out.println("🔔 Creating notification for application: " + saved.getId());
            System.out.println("🔔 Candidate: " + applierName + ", Job: " + job.getJobName());
            
            // Create notification with detailed logging
            Notification notification = notificationService.createNewApplicationNotification(
                applierName, 
                job.getJobName(), 
                saved.getId()
            );
            
            System.out.println("✅ Notification created successfully: " + notification.getId());
            System.out.println("✅ Notification title: " + notification.getTitle());
            System.out.println("✅ Notification message: " + notification.getMessage());
            System.out.println("✅ Related entity ID: " + notification.getRelatedEntityId());
            System.out.println("✅ Related entity type: " + notification.getRelatedEntityType());
            
        } catch (Exception e) {
            // Log error but don't fail the application submission
            System.err.println("❌ Failed to create notification: " + e.getMessage());
            e.printStackTrace();
        }

        // ✅ Convert to DTO before returning
        return ResponseEntity.ok(formService.convertToDTO(saved));
    }

    // ✅ Get all applications as DTO
    @GetMapping
    public List<WebsiteApplicationDTO> getAll() {
        return formService.getAllDTO();
    }

    // ✅ Get single application as DTO
    @GetMapping("/{id}")
    public ResponseEntity<WebsiteApplicationDTO> getById(@PathVariable Long id) {
        WebsiteApplicationDTO dto = formService.getByIdDTO(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }
    
    // ✅ Test endpoint to create a notification
    @PostMapping("/test-notification")
    public ResponseEntity<String> testNotification() {
        try {
            System.out.println("🧪 Testing notification creation...");
            Notification notification = notificationService.createNotification(
                "Test Notification", 
                "This is a test notification to verify the system works", 
                com.example.Material_Mitra.enums.NotificationType.GENERAL
            );
            System.out.println("✅ Test notification created with ID: " + notification.getId());
            return ResponseEntity.ok("Test notification created successfully with ID: " + notification.getId());
        } catch (Exception e) {
            System.err.println("❌ Test notification failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Test notification failed: " + e.getMessage());
        }
    }
    
    
//    @PatchMapping("/{id}/status")
//    public ResponseEntity<WebsiteApplicationDTO> updateStatus(
//            @PathVariable Long id,
//            @RequestParam WebsiteReviewed status
//    ) {
//        WebsiteApplicationDTO updated = formService.updateStatus(id, status);
//        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
//    }
    @PatchMapping("/{id}/status")
    public ResponseEntity<WebsiteApplicationDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam WebsiteReviewed status
    ) {
        WebsiteApplicationDTO updated = formService.updateStatus(id, status);
        
        // ✅ Create notification for status update
        if (updated != null) {
            try {
                notificationService.createApplicationUpdateNotification(
                    updated.getApplierName(),
                    updated.getJobName(),
                    status.toString(),
                    id
                );
            } catch (Exception e) {
                // Log error but don't fail the status update
                System.err.println("Failed to create status update notification: " + e.getMessage());
            }
        }
        
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    // View resume for website application - Redirect to S3
    @GetMapping("/{id}/resume/view")
    public ResponseEntity<?> viewResume(@PathVariable Long id) {
        try {
            WebsiteApplicationDTO application = formService.getByIdDTO(id);
            if (application == null) {
                return ResponseEntity.notFound().build();
            }

            if (application.getResumePath() == null || application.getResumePath().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Resume not found for application: " + application.getApplierName());
            }

            // Generate S3 presigned URL
            String presignedUrl = fileStorageService.getFileUrl(application.getResumePath());
            
            // Redirect to S3 presigned URL
            return ResponseEntity.status(302)
                    .header(HttpHeaders.LOCATION, presignedUrl)
                    .build();

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error viewing resume: " + e.getMessage());
        }
    }

    // Download resume for website application - Redirect to S3
    @GetMapping("/{id}/resume/download")
    public ResponseEntity<?> downloadResume(@PathVariable Long id) {
        try {
            WebsiteApplicationDTO application = formService.getByIdDTO(id);
            if (application == null) {
                return ResponseEntity.notFound().build();
            }

            if (application.getResumePath() == null || application.getResumePath().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Resume not found for application: " + application.getApplierName());
            }

            // Generate S3 presigned URL
            String presignedUrl = fileStorageService.getFileUrl(application.getResumePath());
            
            // Redirect to S3 presigned URL
            return ResponseEntity.status(302)
                    .header(HttpHeaders.LOCATION, presignedUrl)
                    .build();

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error downloading resume: " + e.getMessage());
        }
    }

    // Get resume URL for website application - Return S3 presigned URL
    @GetMapping("/{id}/resume/url")
    public ResponseEntity<?> getResumeUrl(@PathVariable Long id) {
        try {
            WebsiteApplicationDTO application = formService.getByIdDTO(id);
            if (application == null) {
                return ResponseEntity.notFound().build();
            }

            if (application.getResumePath() == null || application.getResumePath().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Resume not found for application: " + application.getApplierName());
            }

            // Generate S3 presigned URL (valid for 1 hour)
            String resumeUrl = fileStorageService.getFileUrl(application.getResumePath());
            return ResponseEntity.ok().body(java.util.Map.of("resumeUrl", resumeUrl));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error getting resume URL: " + e.getMessage());
        }
    }


}
