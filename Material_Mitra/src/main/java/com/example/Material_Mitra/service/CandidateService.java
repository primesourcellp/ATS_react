package com.example.Material_Mitra.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.Material_Mitra.dto.CandidateDTO;
import com.example.Material_Mitra.dto.CandidateDetailsDTO;
import com.example.Material_Mitra.dto.DTOMapper;
import com.example.Material_Mitra.dto.JobDTO;
import com.example.Material_Mitra.entity.ApplicationStatusHistory;
import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.enums.ResultStatus;
import com.example.Material_Mitra.repository.ApplicationStatusHistoryRepository;
import com.example.Material_Mitra.repository.CandidateRepository;
import com.example.Material_Mitra.repository.JobApplicationRepository;
import com.example.Material_Mitra.repository.UserRepository;

import jakarta.transaction.Transactional;
import opennlp.tools.namefind.NameFinderME;
import opennlp.tools.namefind.TokenNameFinderModel;
import opennlp.tools.sentdetect.SentenceDetectorME;
import opennlp.tools.sentdetect.SentenceModel;
import opennlp.tools.tokenize.SimpleTokenizer;
import opennlp.tools.util.Span;

@Service
public class CandidateService {

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;
    
    @Autowired
    private ApplicationStatusHistoryRepository statusHistoryRepository;
    
    @Autowired
    private S3FileStorageService fileStorageService;
    
    @Autowired
    private UserRepository userRepository;


    private final NameFinderME nameFinder;
    private final SentenceDetectorME sentenceDetector;

    public CandidateService() throws IOException {
        try (InputStream nameModelStream = getClass().getResourceAsStream("/models/en-ner-person.bin");
             InputStream sentModelStream = getClass().getResourceAsStream("/models/opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin")) {

            if (nameModelStream == null || sentModelStream == null) {
                throw new RuntimeException("OpenNLP model files not found");
            }

            nameFinder = new NameFinderME(new TokenNameFinderModel(nameModelStream));
            sentenceDetector = new SentenceDetectorME(new SentenceModel(sentModelStream));
        }
    }

   
    // ----- Your existing methods remain unchanged -----

    public Candidate createCandidate(Candidate candidate, MultipartFile resumeFile) {
        if (candidate.getId() != null) {
            throw new IllegalArgumentException("New candidate cannot have an ID");
        }

        // Validate for duplicates before saving
        validateCandidateUniqueness(candidate);

        try {
            if (resumeFile != null && !resumeFile.isEmpty()) {
                String resumePath = fileStorageService.storeFile(resumeFile, "resumes/candidates");
                candidate.setResumePath(resumePath);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to store resume file", e);
        }

        if (candidate.getCreatedAt() == null) {
            candidate.setCreatedAt(LocalDateTime.now());
        }
        // Set default status if null
        if (candidate.getStatus() == null) {
            candidate.setStatus(ResultStatus.NEW_CANDIDATE);
        }
        candidate.setUpdatedAt(LocalDateTime.now());
        getAuthenticatedUser().ifPresent(user -> {
            candidate.setCreatedBy(user);
            candidate.setCreatedByUserId(user.getId());
            if (candidate.getCreatedByName() == null || candidate.getCreatedByName().isBlank()) {
                candidate.setCreatedByName(user.getUsername());
            }
            if (candidate.getCreatedByEmail() == null || candidate.getCreatedByEmail().isBlank()) {
                candidate.setCreatedByEmail(user.getEmail());
            }
        });
        if (candidate.getCreatedBy() != null) {
            if (candidate.getCreatedByUserId() == null) {
                candidate.setCreatedByUserId(candidate.getCreatedBy().getId());
            }
            if (candidate.getCreatedByName() == null || candidate.getCreatedByName().isBlank()) {
                candidate.setCreatedByName(candidate.getCreatedBy().getUsername());
            }
            if (candidate.getCreatedByEmail() == null || candidate.getCreatedByEmail().isBlank()) {
                candidate.setCreatedByEmail(candidate.getCreatedBy().getEmail());
            }
        }
        return candidateRepository.save(candidate);
    }

    private void validateCandidateUniqueness(Candidate candidate) {
        // Check for duplicate email
        if (candidate.getEmail() != null && !candidate.getEmail().trim().isEmpty()) {
            List<Candidate> existingByEmail = candidateRepository.findByEmail(candidate.getEmail().trim());
            if (!existingByEmail.isEmpty()) {
                throw new RuntimeException("Email already exists: " + candidate.getEmail());
            }
        }

        // Check for duplicate phone
        if (candidate.getPhone() != null && !candidate.getPhone().trim().isEmpty()) {
            Optional<Candidate> existingByPhone = candidateRepository.findByPhone(candidate.getPhone().trim());
            if (existingByPhone.isPresent()) {
                throw new RuntimeException("Phone number already exists: " + candidate.getPhone());
            }
        }
    }

    public Candidate getDocument(Long id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    @Transactional
    public Candidate getCandidateById(Long id) {
        Candidate candidate = candidateRepository.findByIdWithApplicationsAndJobAndClient(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        
        // Fetch status history separately for each application to avoid MultipleBagFetchException
        if (candidate.getApplications() != null) {
            candidate.getApplications().forEach(application -> {
                // Fetch status history using repository to avoid MultipleBagFetchException
                List<ApplicationStatusHistory> history = 
                    statusHistoryRepository.findByApplicationIdOrderByChangedAtDesc(application.getId());
                
                // Ensure the application relationship is set on each history entry
                if (history != null) {
                    history.forEach(h -> h.setApplication(application));
                }
                
                // Get existing status history list and update it
                List<ApplicationStatusHistory> existing = application.getStatusHistory();
                if (existing == null) {
                    existing = new ArrayList<>();
                    application.setStatusHistory(existing);
                } else {
                    existing.clear();
                }
                
                // Add all fetched history entries
                if (history != null) {
                    existing.addAll(history);
                }
            });
        }
        
        return candidate;
    }

    
    public List<Candidate> getCandidatesByStatus(ResultStatus status) {
        return candidateRepository.findByStatus(status);
    }

    public List<Candidate> getCandidatesByEmail(String email) {
        return candidateRepository.findByEmail(email);
    }

    public Optional<Candidate> getCandidateByPhone(String phone) {
        return candidateRepository.findByPhone(phone);
    }

    public List<Candidate> searchCandidatesByName(String name) {
        return candidateRepository.findByNameContainingIgnoreCase(name);
    }

    @Transactional
    public void deleteCandidate(Long candidateId) {
        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new RuntimeException("Candidate not found"));

        List<JobApplication> applications = jobApplicationRepository.findByCandidateId(candidateId);

        if (!applications.isEmpty()) {
            throw new RuntimeException("Candidate cannot be deleted because applications exist.");
        }

        candidateRepository.delete(candidate);
    }


    public  boolean candidateExists(Long id) {
        return candidateRepository.existsById(id);
    }

    public long getCandidateCount() {
        return candidateRepository.count();
    }

    public Candidate updateCandidatePartial(
            Long id,
            String name,
            String email,
            String phone,
            ResultStatus status,
            String about,
            String experience,
            String noticePeriod,
            String location,
            String currentCtc,
            String expectedCtc,
            String skills,
            MultipartFile resumePdf
    ) {
        Candidate existing = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        if (name != null) existing.setName(name);
        if (email != null) existing.setEmail(email);
        if (phone != null) existing.setPhone(phone);
        if (status != null) existing.setStatus(status);
        if (about != null) existing.setAbout(about);
        if (experience != null) existing.setExperience(experience);
        if (noticePeriod != null) existing.setNoticePeriod(noticePeriod);
        if (location != null) existing.setLocation(location);
        if (currentCtc != null) existing.setCurrentCtc(currentCtc);
        if (expectedCtc != null) existing.setExpectedCtc(expectedCtc);
        if (skills != null) existing.setSkills(skills);

        if (resumePdf != null && !resumePdf.isEmpty()) {
            try {
                // Delete old resume if exists
                if (existing.getResumePath() != null) {
                    fileStorageService.deleteFile(existing.getResumePath());
                }
                // Store new resume
                String resumePath = fileStorageService.storeFile(resumePdf, "resumes/candidates");
                existing.setResumePath(resumePath);
            } catch (Exception e) {
                throw new RuntimeException("Failed to store resume PDF file", e);
            }
        }

        existing.setUpdatedAt(LocalDateTime.now());
        return candidateRepository.save(existing);
    }

    public List<Candidate> getCandidatesByJobId(Long jobId) {
        return jobApplicationRepository.findCandidatesByJobId(jobId);
    }

//    public List<CandidateDTO> getAllCandidates() {
//        return candidateRepository.findAll().stream()
//            .map(candidate -> {
//                CandidateDTO dto = new CandidateDTO();
//                dto.setId(candidate.getId());
//                dto.setName(candidate.getName());
//                dto.setEmail(candidate.getEmail());
//                dto.setPhone(candidate.getPhone());
//                dto.setSkills(candidate.getSkills());
//
//                dto.setNoticePeriod(candidate.getNoticePeriod());
//                dto.setCurrentCtc(candidate.getCurrentCtc());
//                dto.setExpectedCtc(candidate.getExpectedCtc());
//                dto.setLocation(candidate.getLocation());
//                dto.setUpdatedAt(candidate.getUpdatedAt());
//                dto.setAbout(candidate.getAbout());
//                dto.setStatus(candidate.getStatus() != null ? candidate.getStatus().toString() : "NA");
//
//                List<JobApplicationDTO> apps = candidate.getApplications().stream().map(app -> {
//                    JobApplicationDTO appDTO = new JobApplicationDTO();
//                    appDTO.setId(app.getId());
//                    JobDTO jobDTO = new JobDTO();
//                    jobDTO.setJobName(app.getJob().getJobName());
//                    appDTO.setJob(jobDTO);
//                    return appDTO;
//                }).collect(Collectors.toList());
//
//                dto.setApplications(apps);
//                return dto;
//            }).collect(Collectors.toList());
//    }
    private Optional<User> getAuthenticatedUser() {
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
    
    public List<CandidateDTO> getAllCandidates() {
        User currentUser = getAuthenticatedUser().orElse(null);

        // Admin / Secondary admin or unauthenticated: see all candidates
        if (currentUser == null ||
            currentUser.getRole() == null ||
            currentUser.getRole() == com.example.Material_Mitra.enums.RoleStatus.ADMIN ||
            currentUser.getRole() == com.example.Material_Mitra.enums.RoleStatus.SECONDARY_ADMIN ||
            !currentUser.isRestrictCandidates()) {

            return candidateRepository.findAll().stream()
                .map(DTOMapper::toCandidateDTO)
                .collect(Collectors.toList());
        }

        // Recruiter with restriction: only candidates whose job's client is assigned to them
        List<Candidate> restricted = jobApplicationRepository.findCandidatesByAssignedRecruiter(currentUser.getId());
        return restricted.stream()
                .map(DTOMapper::toCandidateDTO)
                .collect(Collectors.toList());
    }


    public List<Candidate> searchCandidates(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return candidateRepository.findAll();
        }
        return candidateRepository.searchCandidatesByKeyword(keyword);
    }

    
    
  

    
    
    
    
    
    
    
//    ******************************************************
    // ------------- Helper methods for parsing -------------
    private String extractPattern(String text, String regex) {
        Matcher matcher = Pattern.compile(regex).matcher(text);
        return matcher.find() ? matcher.group().trim() : null;
    }
    
    // Improved email extraction - avoid extracting from URLs
    private String extractEmail(String text) {
        // Email pattern that excludes common false positives in URLs
        String emailPattern = "(?<!http://)(?<!https://)(?<!www\\.)[\\w._%+-]+@[\\w.-]+\\.[a-zA-Z]{2,}(?!\\.(com|net|org|edu|gov))";
        Matcher matcher = Pattern.compile(emailPattern, Pattern.CASE_INSENSITIVE).matcher(text);
        if (matcher.find()) {
            String email = matcher.group().trim().toLowerCase();
            // Additional validation - email should not be in a URL context
            int start = matcher.start();
            String context = text.substring(Math.max(0, start - 10), Math.min(text.length(), start + email.length() + 10));
            if (!context.contains("http") && !context.contains("www.")) {
                return email;
            }
        }
        // Fallback to simple pattern if sophisticated one doesn't work
        return extractPattern(text, "[\\w._%+-]+@[\\w.-]+\\.[a-zA-Z]{2,}");
    }
    
    // Extract years of experience
    private String extractExperience(String text) {
        // Patterns for experience: "5 years", "5+ years", "5 yrs", etc.
        String[] experiencePatterns = {
            "(\\d+)\\s*(?:\\+)?\\s*(?:years?|yrs?|years of experience)",
            "(\\d+)\\s*(?:\\+)?\\s*(?:years?|yrs?)\\s*of\\s*experience",
            "experience:\\s*(\\d+)\\s*(?:\\+)?\\s*(?:years?|yrs?)",
            "(\\d+)\\s*(?:\\+)?\\s*(?:years?|yrs?)\\s*(?:of)?\\s*(?:relevant)?\\s*experience"
        };
        
        for (String pattern : experiencePatterns) {
            Matcher matcher = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(text);
            if (matcher.find()) {
                String years = matcher.group(1);
                return years + " years";
            }
        }
        return null;
    }
    
    // Extract Current CTC
    private String extractCurrentCTC(String text) {
        String[] ctcPatterns = {
            "(?:current|present|current ctc|present ctc|ctc)[\\s:]*[₹]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:lakh|lacs|lac|lpa|lakhs|thousand)",
            "[₹]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:lakh|lacs|lac|lpa|lakhs)[\\s]*(?:current|present|ctc)",
            "(?:drawing|earning|current salary)[\\s:]*[₹]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:lakh|lacs|lac|lpa|lakhs)"
        };
        
        for (String pattern : ctcPatterns) {
            Matcher matcher = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(text);
            if (matcher.find()) {
                return matcher.group(1) + " LPA";
            }
        }
        return null;
    }
    
    // Extract Expected CTC
    private String extractExpectedCTC(String text) {
        String[] ctcPatterns = {
            "(?:expected|expected ctc|expected salary)[\\s:]*[₹]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:lakh|lacs|lac|lpa|lakhs)",
            "[₹]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:lakh|lacs|lac|lpa|lakhs)[\\s]*(?:expected|expecting)",
            "(?:looking for|seeking|expect)[\\s:]*[₹]?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:lakh|lacs|lac|lpa|lakhs)"
        };
        
        for (String pattern : ctcPatterns) {
            Matcher matcher = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(text);
            if (matcher.find()) {
                return matcher.group(1) + " LPA";
            }
        }
        return null;
    }
    
// ---------------------------------------------------------extract name using OpenNLP
    private String extractName(String text) {
        if (text == null || text.isBlank()) return null;

        // First, try to find name in the very top lines (usually first 3-5 lines)
        String[] lines = text.split("\\r?\\n");
        String firstLine = lines.length > 0 ? lines[0].trim() : "";
        String topLines = String.join("\n", Arrays.copyOf(lines, Math.min(5, lines.length)));
        
        Map<String, Integer> nameCandidates = new LinkedHashMap<>();

        // Strategy 1: Check if first line is ALL CAPS name (OpenNLP struggles with ALL CAPS)
        // Pattern for ALL CAPS names like "SELVA RAGAVAN R"
        if (!firstLine.isEmpty()) {
            Matcher allCapsMatcher = Pattern.compile("^([A-Z]{2,}(?:[-\\s][A-Z]{2,})*(?:\\s+[A-Z])?\\s+[A-Z]{2,}(?:[-\\s][A-Z]{2,})*(?:\\s+[A-Z])?)").matcher(firstLine);
            if (allCapsMatcher.find()) {
                String candidate = allCapsMatcher.group(1).trim();
                // Remove job titles
                candidate = removeJobTitles(candidate);
                if (isLikelyValidName(candidate, true)) { // true = allow ALL CAPS
                    String cleanName = normalizeName(candidate);
                    nameCandidates.put(cleanName, 100); // Highest score for first line ALL CAPS
                }
            }
        }

        // Strategy 2: Preprocess text for OpenNLP (convert ALL CAPS to Title Case)
        // OpenNLP works better with normal case text
        String processedTopLines = preprocessForOpenNLP(topLines);
        String[] sentences = sentenceDetector.sentDetect(processedTopLines);
        SimpleTokenizer tokenizer = SimpleTokenizer.INSTANCE;

        // Focus on first 5 sentences (top of resume where name usually appears)
        for (int i = 0; i < Math.min(sentences.length, 5); i++) {
            String sentence = sentences[i];
            String[] tokens = tokenizer.tokenize(sentence);
            Span[] spans = nameFinder.find(tokens);

            for (Span span : spans) {
                StringBuilder nameBuilder = new StringBuilder();
                for (int j = span.getStart(); j < span.getEnd(); j++) {
                    nameBuilder.append(tokens[j]).append(" ");
                }

                String rawName = nameBuilder.toString().trim();

                if (isLikelyValidName(rawName, false)) { // false = normal case validation
                    String cleanName = normalizeName(rawName);
                    int score = nameCandidates.getOrDefault(cleanName, 0);

                    // Significantly increase score for appearing in first sentence
                    score += (10 - i) * 2; // Much higher weight for top lines
                    nameCandidates.put(cleanName, score);
                }
            }
            nameFinder.clearAdaptiveData(); // reset adaptive learning for next sentence
        }
        
        // Strategy 3: If no name found in top lines, try first 10 sentences of full text
        if (nameCandidates.isEmpty()) {
            String processedText = preprocessForOpenNLP(text);
            String[] allSentences = sentenceDetector.sentDetect(processedText);
            for (int i = 0; i < Math.min(allSentences.length, 10); i++) {
                String sentence = allSentences[i];
                String[] tokens = tokenizer.tokenize(sentence);
                Span[] spans = nameFinder.find(tokens);

                for (Span span : spans) {
                    StringBuilder nameBuilder = new StringBuilder();
                    for (int j = span.getStart(); j < span.getEnd(); j++) {
                        nameBuilder.append(tokens[j]).append(" ");
                    }

                    String rawName = nameBuilder.toString().trim();

                    if (isLikelyValidName(rawName, false)) {
                        String cleanName = normalizeName(rawName);
                        int score = nameCandidates.getOrDefault(cleanName, 0);
                        score += (10 - i); // Higher weight for top lines
                        nameCandidates.put(cleanName, score);
                    }
                }
                nameFinder.clearAdaptiveData();
            }
        }

        return nameCandidates.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);
    }
    
    /**
     * Preprocess text for better OpenNLP name recognition
     * Converts ALL CAPS words to Title Case if they look like names
     */
    private String preprocessForOpenNLP(String text) {
        if (text == null || text.isBlank()) return text;
        
        String[] lines = text.split("\\r?\\n");
        if (lines.length > 0) {
            String firstLine = lines[0].trim();
            // Check if first line matches ALL CAPS name pattern (2-5 words, all uppercase)
            if (firstLine.matches("^[A-Z]{2,}(?:[-\\s][A-Z]{2,})*(?:\\s+[A-Z])?\\s+[A-Z]{2,}(?:[-\\s][A-Z]{2,})*(?:\\s+[A-Z])?.*")) {
                // Convert ALL CAPS to Title Case for better OpenNLP recognition
                String[] words = firstLine.split("\\s+");
                StringBuilder converted = new StringBuilder();
                for (int i = 0; i < words.length; i++) {
                    String word = words[i];
                    // Skip if it's a single letter (likely an initial like "R")
                    if (word.length() == 1 && Character.isUpperCase(word.charAt(0))) {
                        converted.append(word);
                    } else if (word.matches("[A-Z]{2,}")) {
                        // Convert ALL CAPS to Title Case: "SELVA" -> "Selva"
                        converted.append(Character.toUpperCase(word.charAt(0)));
                        if (word.length() > 1) {
                            converted.append(word.substring(1).toLowerCase());
                        }
                    } else {
                        converted.append(word);
                    }
                    if (i < words.length - 1) {
                        converted.append(" ");
                    }
                }
                // Replace first line with converted version
                lines[0] = converted.toString();
                return String.join("\n", lines);
            }
        }
        return text;
    }
    
    /**
     * Remove common job titles from extracted text
     */
    private String removeJobTitles(String text) {
        if (text == null || text.isBlank()) return text;
        
        String[] jobTitles = {
            "developer", "engineer", "manager", "analyst", "specialist", "consultant",
            "architect", "designer", "administrator", "coordinator", "director", "lead",
            "senior", "junior", "associate", "assistant", "executive", "officer",
            "programmer", "coder", "tester", "qa", "devops", "sre", "sdet"
        };
        
        String[] words = text.split("\\s+");
        
        // Remove job titles from the start
        while (words.length > 1) {
            String firstWord = words[0].toLowerCase().replaceAll("[^a-z]", "");
            boolean isJobTitle = false;
            for (String title : jobTitles) {
                if (firstWord.contains(title) || title.contains(firstWord)) {
                    isJobTitle = true;
                    break;
                }
            }
            if (isJobTitle) {
                words = Arrays.copyOfRange(words, 1, words.length);
            } else {
                break;
            }
        }
        
        // Remove job titles from the end
        while (words.length > 1) {
            String lastWord = words[words.length - 1].toLowerCase().replaceAll("[^a-z]", "");
            boolean isJobTitle = false;
            for (String title : jobTitles) {
                if (lastWord.contains(title) || title.contains(lastWord)) {
                    isJobTitle = true;
                    break;
                }
            }
            if (isJobTitle) {
                words = Arrays.copyOfRange(words, 0, words.length - 1);
            } else {
                break;
            }
        }
        
        return String.join(" ", words).trim();
    }

    private boolean isLikelyValidName(String name, boolean allowAllCaps) {
        if (name == null || name.isBlank()) return false;
        
        String normalized = normalizeName(name);
        if (normalized.isBlank()) return false;
        
        String[] words = normalized.split("\\s+");
        
        // Must have at least 2 words, max 5 words
        if (words.length < 2 || words.length > 5) return false;
        
        // Check if it's ALL CAPS
        boolean isAllCaps = normalized.equals(normalized.toUpperCase()) && 
                            normalized.matches("[A-Z\\s'-]+");
        
        // If ALL CAPS is not allowed, reject it
        if (isAllCaps && !allowAllCaps) return false;
        
        // Validate each word
        for (String word : words) {
            if (word.length() < 1) return false;
            
            // Allow single letter (for initials like "R" in "SELVA RAGAVAN R")
            if (word.length() == 1) {
                if (!Character.isUpperCase(word.charAt(0))) return false;
                continue;
            }
            
            // Word should start with uppercase
            if (!Character.isUpperCase(word.charAt(0))) return false;
            
            if (isAllCaps) {
                // For ALL CAPS names, all letters should be uppercase
                if (!word.matches("[A-Z]+([-'][A-Z]+)*")) return false;
            } else {
                // For normal case, rest should be lowercase (allow hyphenated names)
                String rest = word.substring(1);
                if (!rest.matches("[a-z]+([-'][a-z]+)*")) return false;
            }
        }
        
        // Exclude common invalid terms and job titles
        String nameLower = normalized.toLowerCase();
        String[] invalidTerms = { 
            "Resume", "Curriculum", "Vitae", "CV", "Email", "Contact", "Mobile", "Phone",
            "Objective", "Summary", "Profile", "Address", "LinkedIn", "GitHub", "Portfolio",
            "Experience", "Education", "Skills", "Projects", "Certifications", "References",
            "Developer", "Engineer", "Manager", "Analyst", "Specialist", "Consultant"
        };
        for (String term : invalidTerms) {
            if (nameLower.contains(term.toLowerCase())) return false;
        }
        
        // Exclude if it contains numbers
        if (normalized.matches(".*\\d+.*")) return false;

        return true;
    }
    
    // Overloaded method for backward compatibility (defaults to normal case)
    private boolean isLikelyValidName(String name) {
        return isLikelyValidName(name, false);
    }
    private String normalizeName(String name) {
        if (name == null) return null;
        // Preserve letters, spaces, hyphens, and apostrophes (for names like "Mary-Jane" or "O'Brien")
        return name.replaceAll("[^A-Za-z\\s'-]", "")  // Remove symbols except hyphens and apostrophes
                   .replaceAll("\\s{2,}", " ")      // Remove extra spaces
                   .trim();
    }
//                 --------skills -------------------
    private String extractSkills(String text) {
        // Comprehensive skills list - Programming Languages, Frameworks, Tools, etc.
        String[] skillsList = {
            // Programming Languages
            "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "C", "Go", "Rust", "Kotlin", 
            "Swift", "Scala", "Ruby", "PHP", "Perl", "R", "MATLAB", "Dart", "Groovy", "Shell Scripting",
            
            // Web Frameworks
            "Spring", "Spring Boot", "Spring MVC", "Spring Security", "Hibernate", "JPA", "Struts",
            "React", "Angular", "Vue.js", "Vue", "Next.js", "Nuxt.js", "Express.js", "Node.js",
            "Django", "Flask", "FastAPI", "Laravel", "CodeIgniter", "Symfony", "ASP.NET", ".NET", "DotNet",
            "Ruby on Rails", "Rails", "Ember.js", "Backbone.js", "Meteor.js", "Svelte",
            
            // Databases
            "SQL", "MySQL", "PostgreSQL", "MongoDB", "Oracle", "SQL Server", "SQLite", "MariaDB",
            "Cassandra", "Redis", "Elasticsearch", "DynamoDB", "Neo4j", "Firebase", "Firestore",
            "CouchDB", "HBase", "InfluxDB",
            
            // Cloud & DevOps
            "AWS", "Amazon Web Services", "Azure", "Google Cloud Platform", "GCP", "Docker", "Kubernetes", "K8s",
            "Jenkins", "CI/CD", "GitLab", "GitHub Actions", "Terraform", "Ansible", "Chef", "Puppet",
            "CloudFormation", "Lambda", "EC2", "S3", "RDS", "CloudFront", "VPC",
            
            // Tools & Technologies
            "Git", "SVN", "JIRA", "Confluence", "Maven", "Gradle", "Ant", "npm", "Yarn", "Webpack",
            "Gulp", "Grunt", "Babel", "ESLint", "Postman", "Swagger", "REST API", "GraphQL", "SOAP",
            "Microservices", "Service-Oriented Architecture", "SOA", "Agile", "Scrum", "DevOps",
            
            // Frontend Technologies
            "HTML", "HTML5", "CSS", "CSS3", "SASS", "SCSS", "LESS", "Bootstrap", "Tailwind CSS",
            "Material UI", "Ant Design", "jQuery", "Redux", "MobX", "Zustand", "Webpack", "Vite",
            
            // Testing
            "JUnit", "TestNG", "Mockito", "Jest", "Cypress", "Selenium", "Selenium WebDriver",
            "Appium", "Protractor", "Karma", "Mocha", "Chai", "Jasmine", "Pytest", "Unit Testing",
            
            // Mobile
            "Android", "iOS", "React Native", "Flutter", "Xamarin", "Ionic", "Cordova",
            "Swift", "Objective-C", "Kotlin", "Android Studio", "Xcode",
            
            // Data & Analytics
            "Data Science", "Machine Learning", "ML", "Deep Learning", "AI", "Artificial Intelligence",
            "TensorFlow", "PyTorch", "Keras", "Pandas", "NumPy", "Scikit-learn", "NLTK", "SpaCy",
            "Hadoop", "Spark", "Apache Spark", "Kafka", "Storm", "Flink", "Airflow",
            
            // Other Technologies
            "Linux", "Unix", "Windows Server", "Apache", "Nginx", "Tomcat", "WebLogic", "JBoss",
            "OAuth", "JWT", "JWT Token", "OAuth2", "LDAP", "Active Directory", "SAML",
            "Blockchain", "Bitcoin", "Ethereum", "Solidity", "Smart Contracts",
            "GraphQL", "gRPC", "RabbitMQ", "Apache Kafka", "Apache Airflow", "Prometheus", "Grafana"
        };

        String textLower = text.toLowerCase();
        List<String> found = new ArrayList<>();
        Map<String, String> skillMap = new LinkedHashMap<>(); // Preserve order and avoid duplicates
        
        for (String skill : skillsList) {
            String skillLower = skill.toLowerCase();
            // Check for exact word match or as part of a word (for better matching)
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(skillLower) + "\\b", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(textLower);
            if (matcher.find() && !skillMap.containsKey(skillLower)) {
                skillMap.put(skillLower, skill); // Store original case
            }
        }
        
        found.addAll(skillMap.values());

        return found.isEmpty() ? null : String.join(", ", found);
    }

    private String extractLocation(String text) {
        // Expanded list of Indian cities and locations
        String[] knownLocations = {
            "Chennai", "Bangalore", "Bengaluru", "Tirunelveli", "Hyderabad", "Mumbai", "Delhi",
            "New Delhi", "Coimbatore", "Pune", "Trichy", "Tiruchirappalli", "Kolkata", "Calcutta",
            "Ahmedabad", "Surat", "Vadodara", "Baroda", "Jaipur", "Lucknow", "Kanpur", "Nagpur",
            "Indore", "Thane", "Bhopal", "Visakhapatnam", "Vizag", "Patna", "Vadodara", "Ghaziabad",
            "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan", "Vasai",
            "Varanasi", "Srinagar", "Amritsar", "Navi Mumbai", "Aurangabad", "Solapur", "Ranchi",
            "Jodhpur", "Gwalior", "Jammu", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh",
            "Noida", "Gurgaon", "Gurugram", "Faridabad", "Mysore", "Mysuru", "Vijayawada",
            "Tirupati", "Warangal", "Salem", "Erode", "Tiruppur", "Dindigul", "Thoothukudi",
            "Tuticorin", "Kochi", "Cochin", "Thiruvananthapuram", "Trivandrum", "Calicut", "Kozhikode",
            "Mangalore", "Hubli", "Belgaum", "Goa", "Panaji", "Margao", "Vasco"
        };

        String textLower = text.toLowerCase();
        // Prioritize by checking in order and looking for word boundaries
        for (String loc : knownLocations) {
            Pattern pattern = Pattern.compile("\\b" + Pattern.quote(loc.toLowerCase()) + "\\b", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(textLower);
            if (matcher.find()) {
                return loc; // Return original case
            }
        }
        return null;
    }

    private String generateNameFromEmail(String email) {
        if (email == null || !email.contains("@")) return null;
        String[] parts = email.split("@")[0].split("[._]");
        return Arrays.stream(parts)
                     .map(part -> part.substring(0, 1).toUpperCase() + part.substring(1).toLowerCase())
                     .collect(Collectors.joining(" "));
    }

    public Candidate parseResumeWithoutSaving(MultipartFile file) throws Exception {
        // Use more efficient parsing with memory limit
        AutoDetectParser parser = new AutoDetectParser();
        BodyContentHandler handler = new BodyContentHandler(1000000); // Limit to 1MB of text
        Metadata metadata = new Metadata();
        
        // Parse the file
        try (InputStream inputStream = file.getInputStream()) {
            parser.parse(inputStream, handler, metadata);
        }

        String content = handler.toString();
        
        // Extract top section (first 2000 chars) for name extraction - resumes usually have name at top
        String topSection = content.length() > 2000 ? content.substring(0, 2000) : content;

        // Extract information with improved methods
        String email = extractEmail(content);
        String phone = extractPhoneNumber(content);
        String skills = extractSkills(content);
        String location = extractLocation(content);
        String experience = extractExperience(content);
        String currentCtc = extractCurrentCTC(content);
        String expectedCtc = extractExpectedCTC(content);
        
        // Name extraction - prioritize top section for better accuracy
        String name = extractName(topSection);
        if (name == null && email != null) {
            name = generateNameFromEmail(email);
        }
        
        Candidate candidate = new Candidate();
        candidate.setName(name);
        candidate.setEmail(email);
        candidate.setPhone(phone);
        candidate.setSkills(skills);
        candidate.setLocation(location);
        candidate.setExperience(experience);
        candidate.setCurrentCtc(currentCtc);
        candidate.setExpectedCtc(expectedCtc);
        
        // Store resume file
        String resumePath = fileStorageService.storeFile(file, "resumes/candidates");
        candidate.setResumePath(resumePath);
        candidate.setUpdatedAt(LocalDateTime.now());

        return candidate;
    }
    private String extractPhoneNumber(String text) {
        // More comprehensive phone number patterns for Indian numbers
        String[] regexPatterns = {
            "(\\+91[-\\s]?)?[6-9]\\d{9}",                    // +91 9876543210 or 9876543210
            "0[6-9]\\d{9}",                                  // 09876543210
            "[6-9]\\d{4}[-\\s]\\d{5}",                       // 98765-43210 or 98765 43210
            "[6-9]\\d{2}[-\\s]\\d{3}[-\\s]\\d{4}",          // 987-654-3210
            "[6-9]\\d{3}[-\\s]\\d{3}[-\\s]\\d{3}",          // 9876-543-210
            "\\(91\\)[-\\s]?[6-9]\\d{9}",                   // (91) 9876543210
            "91[-\\s]?[6-9]\\d{9}",                          // 91 9876543210
            "(?:mobile|phone|contact|tel)[\\s:]*[\\+]?[0-9\\-\\s\\(\\)]+", // Mobile: 9876543210
        };

        for (String regex : regexPatterns) {
            Matcher matcher = Pattern.compile(regex, Pattern.CASE_INSENSITIVE).matcher(text);
            if (matcher.find()) {
                String rawPhone = matcher.group().replaceAll("(?i)(mobile|phone|contact|tel)[\\s:]*", ""); // Remove labels
                String digitsOnly = rawPhone.replaceAll("[^\\d]", ""); // remove all non-digit characters

                // Normalize to standard 10-digit number (Indian format)
                if (digitsOnly.length() == 10 && digitsOnly.charAt(0) >= '6') {
                    return digitsOnly;
                } else if (digitsOnly.length() == 11 && digitsOnly.startsWith("0") && digitsOnly.charAt(1) >= '6') {
                    return digitsOnly.substring(1);
                } else if (digitsOnly.length() == 12 && digitsOnly.startsWith("91") && digitsOnly.charAt(2) >= '6') {
                    return digitsOnly.substring(2);
                } else if (digitsOnly.length() == 13 && digitsOnly.startsWith("091") && digitsOnly.charAt(3) >= '6') {
                    return digitsOnly.substring(3);
                } else if (digitsOnly.length() == 14 && digitsOnly.startsWith("0091") && digitsOnly.charAt(4) >= '6') {
                    return digitsOnly.substring(4);
                }
            }
        }
        
        // Additional pattern: Look for numbers near "mobile", "phone", "contact" keywords
        Pattern keywordPattern = Pattern.compile("(?i)(?:mobile|phone|contact|tel|mob|cell)[\\s:]*[\\+]?[\\s]*(?:91[-\\s]?)?([6-9]\\d{9})");
        Matcher keywordMatcher = keywordPattern.matcher(text);
        if (keywordMatcher.find()) {
            return keywordMatcher.group(1);
        }

        return null;
    }
   
    public CandidateDetailsDTO getCandidateDetails(Long candidateId, Long jobId) {
        System.out.println("Fetching candidate details for candidateId: " + candidateId + ", jobId: " + jobId);

        Optional<Candidate> candidateOpt = candidateRepository.findById(candidateId);
        if (candidateOpt.isEmpty()) {
            System.out.println("Candidate not found with ID: " + candidateId);
            throw new RuntimeException("Candidate not found with ID: " + candidateId);
        }

        Candidate candidate = candidateOpt.get();
        System.out.println("Found candidate: " + candidate.getName() + ", ID: " + candidate.getId());

        CandidateDetailsDTO dto = new CandidateDetailsDTO();
        dto.setId(candidate.getId());
        dto.setName(candidate.getName());
        dto.setEmail(candidate.getEmail());
        dto.setPhone(candidate.getPhone());
        dto.setStatus(candidate.getStatus().name());
        dto.setResumePath(candidate.getResumePath());
        dto.setResumeUrl(candidate.getResumePath() != null ? "/api/files/" + candidate.getResumePath() : null);
        dto.setUpdatedAt(candidate.getUpdatedAt());
        dto.setCreatedAt(candidate.getCreatedAt());
        if (candidate.getCreatedBy() != null) {
            dto.setCreatedById(candidate.getCreatedBy().getId());
            dto.setCreatedByUsername(candidate.getCreatedBy().getUsername());
            dto.setCreatedByEmail(candidate.getCreatedBy().getEmail());
        }

        System.out.println("Looking for job application with candidateId: " + candidateId + " and jobId: " + jobId);
        JobApplication application = jobApplicationRepository.findByCandidateIdAndJobId(candidateId, jobId);

        if (application == null) {
            System.out.println("No application found for this candidate and job combination.");
        } else {
            Job job = application.getJob();
            if (job == null) {
                System.out.println("Application found but job is null for application ID: " + application.getId());
            } else {
                System.out.println("Found application ID: " + application.getId() + ", Job ID: " + job.getId() + ", Job Name: " + job.getJobName() + ", Location: " + job.getJobLocation());

                JobDTO jobDTO = new JobDTO();
                jobDTO.setId(job.getId());
                jobDTO.setJobName(job.getJobName());
                jobDTO.setJobLocation(job.getJobLocation());
                dto.setJobDTO(jobDTO);  // set only current job info
            }
        }

        return dto;
    }



    
}

