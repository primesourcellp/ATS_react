package com.example.Material_Mitra.controller;

import java.time.LocalDateTime;
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
                    "resumeUrl", "http://localhost:8080/api/files/" + candidate.getResumePath(),
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
                    "resumeUrl", "http://localhost:8080/api/files/" + doc.getResumePath(),
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
            Candidate candidate = candidateService.parseResumeWithoutSaving(resumeFile);
            return ResponseEntity.ok(candidate);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to parse resume",
                "message", e.getMessage()
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



}