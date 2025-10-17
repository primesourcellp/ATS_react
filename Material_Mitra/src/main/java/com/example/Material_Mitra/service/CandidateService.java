package com.example.Material_Mitra.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
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
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.Material_Mitra.dto.CandidateDTO;
import com.example.Material_Mitra.dto.CandidateDetailsDTO;
import com.example.Material_Mitra.dto.DTOMapper;
import com.example.Material_Mitra.dto.JobDTO;
import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.enums.ResultStatus;
import com.example.Material_Mitra.repository.CandidateRepository;
import com.example.Material_Mitra.repository.InterviewRepository;
import com.example.Material_Mitra.repository.JobApplicationRepository;
import com.example.Material_Mitra.repository.JobRepository;

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
    private JobRepository jobRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;
    @Autowired
    private InterviewRepository interviewRepository;
    
    @Autowired
    private FileStorageService fileStorageService;


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

    public Candidate getCandidateById(Long id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
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
    
    
    public List<CandidateDTO> getAllCandidates() {
        return candidateRepository.findAll().stream()
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
// ---------------------------------------------------------extract name 
    private String extractName(String text) {
        if (text == null || text.isBlank()) return null;

        String[] sentences = sentenceDetector.sentDetect(text);
        SimpleTokenizer tokenizer = SimpleTokenizer.INSTANCE;

        Map<String, Integer> nameCandidates = new LinkedHashMap<>();

        for (int i = 0; i < Math.min(sentences.length, 10); i++) { // Limit to first 10 sentences (top of resume)
            String sentence = sentences[i];
            String[] tokens = tokenizer.tokenize(sentence);
            Span[] spans = nameFinder.find(tokens);

            for (Span span : spans) {
                StringBuilder nameBuilder = new StringBuilder();
                for (int j = span.getStart(); j < span.getEnd(); j++) {
                    nameBuilder.append(tokens[j]).append(" ");
                }

                String rawName = nameBuilder.toString().trim();

                if (isLikelyValidName(rawName)) {
                    String cleanName = normalizeName(rawName);
                    int score = nameCandidates.getOrDefault(cleanName, 0);

                    // Increase score for appearing early
                    score += (10 - i); // Higher weight for top lines
                    nameCandidates.put(cleanName, score);
                }
            }
            nameFinder.clearAdaptiveData(); // reset adaptive learning for next sentence
        }

        return nameCandidates.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);
    }

    private boolean isLikelyValidName(String name) {
        if (name == null || name.isBlank()) return false;

        // Must be two or more words, starting with uppercase letters, no numbers or special chars
        if (!name.matches("^[A-Z][a-z]+(\\s[A-Z][a-z]+)+$")) return false;

        String[] invalidTerms = { "Resume", "Curriculum", "Vitae", "CV", "Email", "Contact", "Mobile", "Objective" };
        for (String word : invalidTerms) {
            if (name.toLowerCase().contains(word.toLowerCase())) return false;
        }

        return true;
    }
    private String normalizeName(String name) {
        return name.replaceAll("[^A-Za-z\\s]", "")  // Remove symbols
                   .replaceAll("\\s{2,}", " ")      // Remove extra spaces
                   .trim();
    }
//                 --------skills -------------------
    private String extractSkills(String text) {
        String[] skillsList = {
            "Java", "Python", "Spring", "Hibernate", "SQL", "JavaScript",
            "React", "Angular", "Docker", "Kubernetes", "AWS", "Azure"
        };

        List<String> found = new ArrayList<>();
        for (String skill : skillsList) {
            if (text.toLowerCase().contains(skill.toLowerCase())) {
                found.add(skill);
            }
        }

        return found.isEmpty() ? null : String.join(", ", found);
    }

    private String extractLocation(String text) {
        String[] knownLocations = {
            "Chennai", "Bangalore", "Tirunelveli", "Hyderabad", "Mumbai", "Delhi",
            "Coimbatore", "Pune", "Trichy"
        };

        for (String loc : knownLocations) {
            if (text.toLowerCase().contains(loc.toLowerCase())) {
                return loc;
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
        AutoDetectParser parser = new AutoDetectParser();
        BodyContentHandler handler = new BodyContentHandler(-1);
        Metadata metadata = new Metadata();
        parser.parse(file.getInputStream(), handler, metadata);

        String content = handler.toString();

        String email = extractPattern(content, "[\\w._%+-]+@[\\w.-]+\\.[a-zA-Z]{2,}");
        String phone = extractPhoneNumber(content);

        String skills = extractSkills(content);
        String location = extractLocation(content);
        String name = extractName(content);
        if (name == null && email != null) {
            name = generateNameFromEmail(email);
        }

        Candidate candidate = new Candidate();
        candidate.setName(name);
        candidate.setEmail(email);
        candidate.setPhone(phone);
        candidate.setSkills(skills);
        candidate.setLocation(location);
        // Store resume file
        String resumePath = fileStorageService.storeFile(file, "resumes/candidates");
        candidate.setResumePath(resumePath);
        candidate.setUpdatedAt(LocalDate.now());

        return candidate;
    }
    private String extractPhoneNumber(String text) {
        String[] regexPatterns = {
            "(\\+91[-\\s]?)?[6-9]\\d{9}",        // +91 9876543210 or 9876543210
            "0[6-9]\\d{9}",                      // 09876543210
            "[6-9]\\d{4}[-\\s][0-9]{5}"          // 98765-43210 or 98765 43210
        };

        for (String regex : regexPatterns) {
            Matcher matcher = Pattern.compile(regex).matcher(text);
            if (matcher.find()) {
                String rawPhone = matcher.group();
                String digitsOnly = rawPhone.replaceAll("[^\\d]", ""); // remove all non-digit characters

                // Normalize to standard 10-digit number (Indian format)
                if (digitsOnly.length() == 10) {
                    return digitsOnly;
                } else if (digitsOnly.length() == 11 && digitsOnly.startsWith("0")) {
                    return digitsOnly.substring(1);
                } else if (digitsOnly.length() == 12 && digitsOnly.startsWith("91")) {
                    return digitsOnly.substring(2);
                } else if (digitsOnly.length() == 13 && digitsOnly.startsWith("091")) {
                    return digitsOnly.substring(3);
                } else if (digitsOnly.length() == 14 && digitsOnly.startsWith("0091")) {
                    return digitsOnly.substring(4);
                }
            }
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
        dto.setUpdatedAt(candidate.getUpdatedAt().atStartOfDay());

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
