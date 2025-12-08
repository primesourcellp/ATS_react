package com.example.Material_Mitra.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.Material_Mitra.service.ResumeMatchingService;
import com.example.Material_Mitra.service.ResumeMatchingService.JobMatch;

@RestController
@RequestMapping("/api/resume-matching")
@CrossOrigin(origins = "*")
public class ResumeMatchingController {

    @Autowired
    private ResumeMatchingService resumeMatchingService;

    @PostMapping("/match")
    public ResponseEntity<?> matchResumeWithJobs(@RequestParam("resume") MultipartFile resumeFile) {
        try {
            if (resumeFile.isEmpty()) {
                return ResponseEntity.badRequest().body("Resume file is required");
            }

            // Validate file type
            String contentType = resumeFile.getContentType();
            if (contentType == null || 
                (!contentType.equals("application/pdf") && 
                 !contentType.equals("application/msword") && 
                 !contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))) {
                return ResponseEntity.badRequest().body("Invalid file type. Only PDF, DOC, and DOCX files are allowed.");
            }

            List<JobMatch> matches = resumeMatchingService.matchResumeWithJobs(resumeFile);
            
            return ResponseEntity.ok(matches);

        } catch (Exception e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Unknown error";
            
            // Check if it's a rate limit error
            if (errorMessage.contains("Rate Limit") || errorMessage.contains("rate limit") || 
                errorMessage.contains("TPM") || errorMessage.contains("tokens per min")) {
                return ResponseEntity.status(429).body(Map.of(
                    "error", "Rate limit exceeded",
                    "message", errorMessage,
                    "suggestion", "Please wait 2-3 minutes before trying again. Consider upgrading your OpenAI plan for higher rate limits."
                ));
            }
            
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error matching resume",
                "message", errorMessage
            ));
        }
    }

    @PostMapping("/match-job")
    public ResponseEntity<?> matchResumeWithJob(
            @RequestParam("resume") MultipartFile resumeFile,
            @RequestParam("jobId") Long jobId) {
        try {
            if (resumeFile.isEmpty()) {
                return ResponseEntity.badRequest().body("Resume file is required");
            }

            if (jobId == null) {
                return ResponseEntity.badRequest().body("Job ID is required");
            }

            // Validate file type
            String contentType = resumeFile.getContentType();
            if (contentType == null || 
                (!contentType.equals("application/pdf") && 
                 !contentType.equals("application/msword") && 
                 !contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))) {
                return ResponseEntity.badRequest().body("Invalid file type. Only PDF, DOC, and DOCX files are allowed.");
            }

            JobMatch match = resumeMatchingService.matchResumeWithJob(resumeFile, jobId);
            
            return ResponseEntity.ok(match);

        } catch (Exception e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Unknown error";
            
            // Check if it's a rate limit error
            if (errorMessage.contains("Rate Limit") || errorMessage.contains("rate limit") || 
                errorMessage.contains("TPM") || errorMessage.contains("tokens per min")) {
                return ResponseEntity.status(429).body(Map.of(
                    "error", "Rate limit exceeded",
                    "message", errorMessage,
                    "suggestion", "Please wait 2-3 minutes before trying again. Consider upgrading your OpenAI plan for higher rate limits."
                ));
            }
            
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error matching resume with job",
                "message", errorMessage
            ));
        }
    }
}

