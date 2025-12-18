package com.example.Material_Mitra.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.Material_Mitra.dto.CandidateDTO;
import com.example.Material_Mitra.dto.CandidateDetailsDTO;
import com.example.Material_Mitra.dto.DTOMapper;
import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.enums.ResultStatus;
import com.example.Material_Mitra.service.CandidateService;
import com.example.Material_Mitra.service.FileStorageService; // Using local file storage instead
import com.fasterxml.jackson.databind.ObjectMapper;
@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    @Autowired
    private CandidateService candidateService;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    
 // Change your controller method to:

//    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createCandidate(
            @RequestPart("candidate") String candidateJson,
            @RequestPart(value = "resumeFile", required = false) MultipartFile resumeFile) {
        
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            Candidate  candidate = objectMapper.readValue(candidateJson, Candidate.class);
            
            // Set default status if null
            if (candidate.getStatus() == null) {
                candidate.setStatus(ResultStatus.NEW_CANDIDATE);
            }

            // Set resume if provided
            if (resumeFile != null && !resumeFile.isEmpty()) {
                String resumePath = fileStorageService.storeFile(resumeFile, "resumes/candidates");
                candidate.setResumePath(resumePath);
            }

            // ✅ Ensure timestamps include time component
            LocalDateTime now = LocalDateTime.now();
            candidate.setCreatedAt(now);
            candidate.setUpdatedAt(now);

            Candidate savedCandidate = candidateService.createCandidate(candidate, resumeFile);
            return ResponseEntity.ok(savedCandidate);
            
        } catch (RuntimeException e) {
            // Handle validation errors (duplicate email/phone)
            if (e.getMessage().contains("already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                        "error", "Validation Error",
                        "message", e.getMessage(),
                        "field", e.getMessage().contains("Email") ? "email" : "phone"
                    ));
            }
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Server Error",
                    "message", "An unexpected error occurred: " + e.getMessage()
                ));
        }
    }


//    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Candidate> patchCandidate(
            @PathVariable Long id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "status", required = false) ResultStatus status,
            @RequestParam(value = "about", required = false) String about,
            @RequestParam(value = "experience", required = false) String experience,
            @RequestParam(value = "noticePeriod", required = false) String noticePeriod,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "currentCtc", required = false) String currentCtc,
            @RequestParam(value = "expectedCtc", required = false) String expectedCtc,
            @RequestParam(value = "skills", required = false) String skills,
            @RequestParam(value = "resumePdf", required = false) MultipartFile resumePdf
    ) {
        Candidate result = candidateService.updateCandidatePartial(
            id, name, email, phone, status, about, experience, noticePeriod, location, currentCtc, expectedCtc, skills,resumePdf
        );
        return ResponseEntity.ok(result);
    }


//    
//    // View PDF inline in browser
//    @GetMapping("/view/{id}")
//    public ResponseEntity<byte[]> viewDocument(@PathVariable Long id) {
//        Candidate doc = candidateService.getDocument(id);
//
//        return ResponseEntity.ok()
//                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getName() + "\"")
//                .contentType(MediaType.APPLICATION_PDF)
//                .body(doc.getResumePdf());
//    }
 @GetMapping("/view/{id}")
    public ResponseEntity<?> viewDocument(@PathVariable Long id) {
        Candidate candidate = candidateService.getCandidateById(id);

        if (candidate == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Candidate not found");
        }

        if (candidate.getResumePath() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Resume not found for candidate: " + candidate.getName());
        }

        // Return the file path and URL for frontend to use
        return ResponseEntity.ok()
                .body(Map.of(
                    "resumePath", candidate.getResumePath(),
                    "resumeUrl", fileStorageService.getFileUrl(candidate.getResumePath()),
                    "candidateName", candidate.getName()
                ));
    }

    // Get Resume Path for Download
    @GetMapping("/download/{id}")
    public ResponseEntity<?> downloadDocument(@PathVariable Long id) {
        Candidate doc = candidateService.getDocument(id);

        if (doc.getResumePath() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Resume not found for candidate: " + doc.getName());
        }

        // Return the file path and URL for frontend to use
        return ResponseEntity.ok()
                .body(Map.of(
                    "resumePath", doc.getResumePath(),
                    "resumeUrl", fileStorageService.getFileUrl(doc.getResumePath()),
                    "candidateName", doc.getName()
                ));
    }

    // Serve resume file content directly (proxy endpoint)
    @GetMapping("/resume/{id}")
    public ResponseEntity<?> getResumeFile(@PathVariable Long id) {
        try {
            Candidate candidate = candidateService.getCandidateById(id);
            
            if (candidate == null || candidate.getResumePath() == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Return local file URL
            String presignedUrl = fileStorageService.getFileUrl(candidate.getResumePath());
            
            return ResponseEntity.ok()
                    .body(Map.of(
                        "url", presignedUrl,
                        "fileName", "Resume_" + candidate.getName() + ".pdf"
                    ));
                    
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
//    @GetMapping("/{id}")
//    public ResponseEntity<Candidate> getCandidateById(@PathVariable Long id) {
//        Candidate candidate = candidateService.getCandidateById(id);
//        return ResponseEntity.ok(candidate);
//    }

    @GetMapping("/{id}")
    public ResponseEntity<CandidateDTO> getCandidateById(@PathVariable Long id) {
        Candidate candidate = candidateService.getCandidateById(id);
        CandidateDTO dto = DTOMapper.toCandidateDTOWithApplications(candidate);
        return ResponseEntity.ok(dto);
    }


    

 

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Candidate>> getCandidatesByStatus(@PathVariable ResultStatus status) {
        List<Candidate> candidates = candidateService.getCandidatesByStatus(status);
        return ResponseEntity.ok(candidates);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<List<Candidate>> getCandidatesByEmail(@PathVariable String email) {
        List<Candidate> candidates = candidateService.getCandidatesByEmail(email);
        if (candidates.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(candidates);
    }


    @GetMapping("/phone/{phone}")
    public ResponseEntity  <Candidate> getCandidateByPhone(@PathVariable String phone) {
        Optional<Candidate> candidate = candidateService.getCandidateByPhone(phone);
        return candidate.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    //searchCandidatesByName
    @GetMapping("/search/{name}")
    public ResponseEntity<List<Candidate>> searchCandidatesByName(@PathVariable String name) {
        List<Candidate> candidates = candidateService.searchCandidatesByName(name);
        return ResponseEntity.ok(candidates);
    }

//
//    @DeleteMapping("/{id}")
//    public ResponseEntity<String> deleteCandidate(@PathVariable Long id) {
//        if (candidateService.candidateExists(id)) {
//            candidateService.deleteCandidate(id);
//            return ResponseEntity.ok("Candidate with ID " + id + " deleted successfully.");
//        } else {
//            return ResponseEntity.status(404).body("Candidate with ID " + id + " not found.");
//        }
//    }
//    @DeleteMapping("/{id}")
//    public ResponseEntity<?> deleteCandidate(@PathVariable Long id) {
//        try {
//            // Check if candidate has any active applications
//            List<JobApplication> applications = applicationRepository.findByCandidateId(id);
//            if (!applications.isEmpty()) {
//                return ResponseEntity.badRequest().body(
//                    Map.of("message", "Cannot delete candidate with active job applications")
//                );
//            }
//            
//            candidateService.deleteCandidate(id);
//            return ResponseEntity.ok().build();
//        } catch (RuntimeException e) {
//            return ResponseEntity.notFound().build();
//        }
//    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteCandidate(@PathVariable Long id) {
        try {
            candidateService.deleteCandidate(id);
            return ResponseEntity.ok("Candidate with ID " + id + " deleted successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/count")
    public long getCandidateCount() {
        return candidateService.getCandidateCount();
    }
   


    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<Candidate>> getCandidatesByJobId(@PathVariable Long jobId) {
        List<Candidate> candidates = candidateService.getCandidatesByJobId(jobId);
        if (candidates.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(candidates);
    }
    
    @GetMapping
    public List<CandidateDTO> getAllCandidates() {
        return candidateService.getAllCandidates();
    }
    @GetMapping("/filter")
    public ResponseEntity<List<Candidate>> filterCandidates(@RequestParam(required = false) String keyword) {
        if (keyword == null || keyword.isBlank()) {
            keyword = ""; // default to empty string
        }
        List<Candidate> candidates = candidateService.searchCandidates(keyword);
        return ResponseEntity.ok(candidates);
    }
    
    /**
     * Search candidates by skills/keywords in their resume content
     * OPTIMIZED: Uses parallel processing and caching for fast search across 2000+ resumes
     * This searches through actual resume files, not just the skills field in database
     * Example: /api/candidates/search-by-resume?keywords=Java,Spring Boot&offset=0&limit=100
     */
    @GetMapping("/search-by-resume")
    public ResponseEntity<List<CandidateDTO>> searchCandidatesByResumeContent(
            @RequestParam(required = false) String keywords,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "500") int limit) {
        if (keywords == null || keywords.trim().isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>());
        }
        
        // Limit maximum results to prevent timeout
        int maxLimit = Math.min(limit, 500);
        int validOffset = Math.max(0, offset);
        
        List<Candidate> candidates = candidateService.searchCandidatesByResumeContent(keywords, validOffset, maxLimit);
        List<CandidateDTO> candidateDTOs = candidates.stream()
                .map(DTOMapper::toCandidateDTO)
                .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(candidateDTOs);
    }
    
    /**
     * Get count of candidates matching keywords in resume content
     * Faster endpoint that only returns the count without full candidate data
     * Example: /api/candidates/search-by-resume/count?keywords=Java,Spring Boot
     */
    @GetMapping("/search-by-resume/count")
    public ResponseEntity<Map<String, Object>> getResumeSearchCount(
            @RequestParam(required = false) String keywords) {
        if (keywords == null || keywords.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of("count", 0));
        }
        
        long count = candidateService.countCandidatesByResumeContent(keywords);
        return ResponseEntity.ok(Map.of("count", count, "keywords", keywords));
    }
 // ✅ Parse resume and create candidate from file only
//    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    public ResponseEntity<?> parseAndSaveCandidateFromResume(
//            @RequestPart("resumeFile") MultipartFile resumeFile) {
//
//        try {
//            Candidate parsedCandidate = candidateService.parseResumeAndSaveCandidate(resumeFile);
//            return ResponseEntity.ok(parsedCandidate);
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of(
//                    "error", "Resume parsing failed",
//                    "message", e.getMessage()
//            ));
//        }
//    }

    @PostMapping(value = "/parse-only", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> parseResumeOnly(@RequestPart("resumeFile") MultipartFile resumeFile) {
        try {
            // Validate file
            if (resumeFile == null || resumeFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to parse resume",
                    "message", "No file provided or file is empty"
                ));
            }
            
            // Log file info for debugging
            System.out.println("=== RESUME PARSING DEBUG ===");
            System.out.println("File Name: " + resumeFile.getOriginalFilename());
            System.out.println("File Size: " + resumeFile.getSize() + " bytes");
            System.out.println("Content Type: " + resumeFile.getContentType());
            
            Candidate candidate = candidateService.parseResumeWithoutSaving(resumeFile);
            
            System.out.println("Parsing successful!");
            System.out.println("Extracted Name: " + candidate.getName());
            System.out.println("Extracted Email: " + candidate.getEmail());
            System.out.println("Extracted Skills: " + (candidate.getSkills() != null ? candidate.getSkills().substring(0, Math.min(100, candidate.getSkills().length())) : "null"));
            System.out.println("=== END PARSING DEBUG ===");
            
            return ResponseEntity.ok(candidate);
        } catch (Exception e) {
            // Log detailed error
            System.err.println("=== RESUME PARSING ERROR ===");
            System.err.println("File Name: " + (resumeFile != null ? resumeFile.getOriginalFilename() : "null"));
            System.err.println("Error Type: " + e.getClass().getSimpleName());
            System.err.println("Error Message: " + e.getMessage());
            e.printStackTrace();
            System.err.println("=== END PARSING ERROR ===");
            
            // Provide more specific error messages
            String errorMessage = e.getMessage();
            String userFriendlyMessage = "Failed to parse resume";
            
            if (errorMessage != null) {
                if (errorMessage.contains("password") || errorMessage.contains("encrypted")) {
                    userFriendlyMessage = "Resume file is password-protected. Please remove password protection and try again.";
                } else if (errorMessage.contains("corrupted") || errorMessage.contains("invalid")) {
                    userFriendlyMessage = "Resume file appears to be corrupted or invalid. Please try uploading the file again or use a different file.";
                } else if (errorMessage.contains("empty") || errorMessage.contains("no text")) {
                    userFriendlyMessage = "Resume file contains no readable text (may be image-only). Please use a text-based resume file.";
                } else if (errorMessage.contains("format") || errorMessage.contains("type")) {
                    userFriendlyMessage = "Unsupported file format. Please upload a PDF, DOC, or DOCX file.";
                } else if (errorMessage.contains("size") || errorMessage.contains("too large")) {
                    userFriendlyMessage = "File is too large. Please upload a file smaller than 10MB.";
                } else {
                    userFriendlyMessage = "Failed to parse resume: " + errorMessage;
                }
            }
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to parse resume",
                "message", userFriendlyMessage,
                "details", errorMessage != null ? errorMessage : "Unknown error occurred"
            ));
        }
    }
    

//
//    @GetMapping("/details/{id}")
//    public ResponseEntity<CandidateDetailsDTO> getCandidateDetails(@PathVariable Long id) {
//        CandidateDetailsDTO dto = candidateService.getCandidateDetails(id);
//        return ResponseEntity.ok(dto);
//    }
    @GetMapping("/{candidateId}/details")
    public CandidateDetailsDTO getCandidateWithJobDetails(
        @PathVariable Long candidateId,
        @RequestParam Long jobId) {
        return candidateService.getCandidateDetails(candidateId, jobId);
    }

    /**
     * Debug endpoint to view extracted resume text for a candidate
     * This helps verify that resume text extraction is working correctly
     * Example: GET /api/candidates/{id}/resume-text
     */
    @GetMapping("/{id}/resume-text")
    public ResponseEntity<Map<String, Object>> getResumeText(@PathVariable Long id) {
        try {
            String resumeText = candidateService.getResumeTextForCandidate(id);
            Candidate candidate = candidateService.getCandidateById(id);
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("candidateId", id);
            response.put("candidateName", candidate.getName());
            response.put("resumePath", candidate.getResumePath());
            response.put("resumeText", resumeText);
            response.put("textLength", resumeText.length());
            response.put("preview", resumeText.length() > 500 ? resumeText.substring(0, 500) + "..." : resumeText);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Backfill resume text for existing candidates
     * Processes all candidates that have resume files but no resume_text stored
     * This is useful for migrating existing resumes to the new fast search system
     * 
     * Example: POST /api/candidates/backfill-resume-text?batchSize=50
     * 
     * @param batchSize Number of candidates to process in each batch (default: 50)
     * @return Statistics about the backfill process
     */
    @PostMapping("/backfill-resume-text")
    public ResponseEntity<Map<String, Object>> backfillResumeText(
            @RequestParam(value = "batchSize", defaultValue = "50") int batchSize) {
        try {
            if (batchSize <= 0 || batchSize > 200) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Batch size must be between 1 and 200"));
            }
            
            System.out.println("Backfill request received with batch size: " + batchSize);
            Map<String, Object> result = candidateService.backfillResumeText(batchSize);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error during backfill: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Backfill failed: " + e.getMessage()));
        }
    }

}