package com.example.Material_Mitra.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.enums.RoleStatus;
import com.example.Material_Mitra.repository.CandidateRepository;
import com.example.Material_Mitra.repository.UserRepository;
import com.example.Material_Mitra.service.EmailService;

@RestController
@RequestMapping("/api/candidate-emails")
public class CandidateEmailController {

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    @Value("${company.url:https://www.primesourcellp.com}")
    private String companyUrl;

    /**
     * Get email preview for admin
     */
    @GetMapping("/preview")
    public ResponseEntity<?> getEmailPreview() {
        try {
            // Check if user is admin
            if (!isAdmin()) {
                return ResponseEntity.status(403).body(Map.of("error", "Only admins can access this feature"));
            }

            String preview = emailService.getCandidateInvitationEmailPreview("Sample Candidate", companyUrl);
            return ResponseEntity.ok(Map.of("preview", preview, "companyUrl", companyUrl));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all candidates with email addresses
     */
    @GetMapping("/candidates")
    public ResponseEntity<?> getAllCandidatesWithEmail() {
        try {
            // Check if user is admin
            if (!isAdmin()) {
                return ResponseEntity.status(403).body(Map.of("error", "Only admins can access this feature"));
            }

            List<Map<String, Object>> candidates = candidateRepository.findAll()
                .stream()
                .filter(c -> c.getEmail() != null && !c.getEmail().trim().isEmpty())
                .map(c -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", c.getId());
                    map.put("name", c.getName());
                    map.put("email", c.getEmail());
                    return map;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("candidates", candidates, "total", candidates.size()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Send emails to selected candidates
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendBulkEmails(@RequestBody Map<String, Object> request) {
        try {
            // Check if user is admin
            if (!isAdmin()) {
                return ResponseEntity.status(403).body(Map.of("error", "Only admins can send bulk emails"));
            }

            @SuppressWarnings("unchecked")
            List<Long> candidateIds = (List<Long>) request.get("candidateIds");
            String customUrl = (String) request.get("companyUrl");
            String customMessage = (String) request.get("customMessage");

            if (candidateIds == null || candidateIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No candidates selected"));
            }

            String urlToUse = (customUrl != null && !customUrl.trim().isEmpty()) ? customUrl : companyUrl;

            List<Candidate> candidates = candidateRepository.findAllById(candidateIds)
                .stream()
                .filter(c -> c.getEmail() != null && !c.getEmail().trim().isEmpty())
                .collect(Collectors.toList());

            if (candidates.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No valid candidates with email addresses found"));
            }

            int successCount = 0;
            int failCount = 0;
            Map<String, String> errors = new HashMap<>();

            for (Candidate candidate : candidates) {
                try {
                    emailService.sendCandidateInvitationEmail(
                        candidate.getEmail(),
                        candidate.getName(),
                        urlToUse,
                        customMessage
                    );
                    successCount++;
                } catch (Exception e) {
                    failCount++;
                    errors.put(candidate.getEmail(), e.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("total", candidates.size());
            response.put("successCount", successCount);
            response.put("failCount", failCount);
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Send emails to all candidates
     */
    @PostMapping("/send-all")
    public ResponseEntity<?> sendEmailsToAllCandidates(@RequestBody Map<String, String> request) {
        try {
            // Check if user is admin
            if (!isAdmin()) {
                return ResponseEntity.status(403).body(Map.of("error", "Only admins can send bulk emails"));
            }

            String customUrl = request.get("companyUrl");
            String customMessage = request.get("customMessage");
            String urlToUse = (customUrl != null && !customUrl.trim().isEmpty()) ? customUrl : companyUrl;

            List<Candidate> candidates = candidateRepository.findAll()
                .stream()
                .filter(c -> c.getEmail() != null && !c.getEmail().trim().isEmpty())
                .collect(Collectors.toList());

            if (candidates.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No candidates with email addresses found"));
            }

            int successCount = 0;
            int failCount = 0;
            Map<String, String> errors = new HashMap<>();

            for (Candidate candidate : candidates) {
                try {
                    emailService.sendCandidateInvitationEmail(
                        candidate.getEmail(),
                        candidate.getName(),
                        urlToUse,
                        customMessage
                    );
                    successCount++;
                } catch (Exception e) {
                    failCount++;
                    errors.put(candidate.getEmail(), e.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("total", candidates.size());
            response.put("successCount", successCount);
            response.put("failCount", failCount);
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private boolean isAdmin() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return false;
            }

            String username = authentication.getName();
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return false;
            }

            User user = userOpt.get();
            return user.getRole() == RoleStatus.ADMIN || user.getRole() == RoleStatus.SECONDARY_ADMIN;
        } catch (Exception e) {
            return false;
        }
    }
}

