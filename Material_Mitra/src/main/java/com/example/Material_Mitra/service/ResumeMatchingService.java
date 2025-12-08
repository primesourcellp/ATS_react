package com.example.Material_Mitra.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.enums.JobStatus;
import com.example.Material_Mitra.repository.JobRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;

@Service
public class ResumeMatchingService {

    @Autowired
    private JobRepository jobRepository;

    @Value("${openai.api-key}")
    private String openaiApiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String openaiModel;

    @Value("${openai.max-tokens:2000}")
    private Integer maxTokens;

    @Value("${openai.temperature:0.3}")
    private Double temperature;

    @Value("${openai.timeout-seconds:60}")
    private Integer timeoutSeconds;

    // Track last request time to add delay between requests
    private static long lastResumeMatchingRequestTime = 0;
    private static final long MIN_RESUME_MATCHING_INTERVAL_MS = 5000; // Minimum 5 seconds between resume matching requests

    public static class JobMatch {
        private Long jobId;
        private String jobName;
        private String jobLocation;
        private String skills;
        private String experience;
        private String salaryRange;
        private String clientName;
        private Double matchScore;
        private String matchReason;
        private String strengths;
        private String gaps;

        // Getters and Setters
        public Long getJobId() { return jobId; }
        public void setJobId(Long jobId) { this.jobId = jobId; }
        public String getJobName() { return jobName; }
        public void setJobName(String jobName) { this.jobName = jobName; }
        public String getJobLocation() { return jobLocation; }
        public void setJobLocation(String jobLocation) { this.jobLocation = jobLocation; }
        public String getSkills() { return skills; }
        public void setSkills(String skills) { this.skills = skills; }
        public String getExperience() { return experience; }
        public void setExperience(String experience) { this.experience = experience; }
        public String getSalaryRange() { return salaryRange; }
        public void setSalaryRange(String salaryRange) { this.salaryRange = salaryRange; }
        public String getClientName() { return clientName; }
        public void setClientName(String clientName) { this.clientName = clientName; }
        public Double getMatchScore() { return matchScore; }
        public void setMatchScore(Double matchScore) { this.matchScore = matchScore; }
        public String getMatchReason() { return matchReason; }
        public void setMatchReason(String matchReason) { this.matchReason = matchReason; }
        public String getStrengths() { return strengths; }
        public void setStrengths(String strengths) { this.strengths = strengths; }
        public String getGaps() { return gaps; }
        public void setGaps(String gaps) { this.gaps = gaps; }
    }

    public List<JobMatch> matchResumeWithJobs(MultipartFile resumeFile) {
        try {
            // Validate API key
            if (openaiApiKey == null || openaiApiKey.trim().isEmpty() || openaiApiKey.equals("your-openai-api-key-here")) {
                throw new RuntimeException("OpenAI API key is not configured. Please set openai.api-key in application.properties");
            }

            // Add delay between requests to prevent rate limiting
            long currentTime = System.currentTimeMillis();
            long timeSinceLastRequest = currentTime - lastResumeMatchingRequestTime;
            if (timeSinceLastRequest < MIN_RESUME_MATCHING_INTERVAL_MS) {
                long waitTime = MIN_RESUME_MATCHING_INTERVAL_MS - timeSinceLastRequest;
                try {
                    Thread.sleep(waitTime);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            lastResumeMatchingRequestTime = System.currentTimeMillis();

            // Get all active jobs
            List<Job> activeJobs = jobRepository.findByStatus(JobStatus.ACTIVE);
            if (activeJobs.isEmpty()) {
                throw new RuntimeException("No active jobs found in the system.");
            }

            // Extract resume text
            String resumeText = extractResumeText(resumeFile);
            
            // Validate extracted text
            if (resumeText == null || resumeText.trim().isEmpty() || resumeText.trim().length() < 50) {
                throw new RuntimeException("Failed to extract meaningful text from resume. The file may be corrupted, password-protected, or contain only images. Please ensure the resume has readable text content.");
            }

            // Truncate resume text aggressively (max 2000 chars)
            if (resumeText.length() > 2000) {
                resumeText = resumeText.substring(0, 2000) + "\n\n[Resume truncated...]";
            }

            // Build jobs context
            String jobsContext = buildJobsContext(activeJobs);

            // Use OpenAI to match resume with jobs
            List<JobMatch> matches = analyzeMatchesWithAI(resumeText, jobsContext, activeJobs);

            // Sort by match score (descending)
            matches.sort((a, b) -> Double.compare(b.getMatchScore(), a.getMatchScore()));

            return matches;

        } catch (Exception e) {
            throw new RuntimeException("Error matching resume with jobs: " + e.getMessage(), e);
        }
    }

    public JobMatch matchResumeWithJob(MultipartFile resumeFile, Long jobId) {
        try {
            // Validate API key
            if (openaiApiKey == null || openaiApiKey.trim().isEmpty() || openaiApiKey.equals("your-openai-api-key-here")) {
                throw new RuntimeException("OpenAI API key is not configured. Please set openai.api-key in application.properties");
            }

            // Add delay between requests to prevent rate limiting
            long currentTime = System.currentTimeMillis();
            long timeSinceLastRequest = currentTime - lastResumeMatchingRequestTime;
            if (timeSinceLastRequest < MIN_RESUME_MATCHING_INTERVAL_MS) {
                long waitTime = MIN_RESUME_MATCHING_INTERVAL_MS - timeSinceLastRequest;
                try {
                    Thread.sleep(waitTime);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            lastResumeMatchingRequestTime = System.currentTimeMillis();

            // Get the specific job
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found with ID: " + jobId));

            // Extract resume text
            String resumeText = extractResumeText(resumeFile);
            
            // Validate extracted text
            if (resumeText == null || resumeText.trim().isEmpty() || resumeText.trim().length() < 50) {
                throw new RuntimeException("Failed to extract meaningful text from resume. The file may be corrupted, password-protected, or contain only images. Please ensure the resume has readable text content.");
            }

            // Truncate resume text aggressively to reduce tokens (max 3000 chars)
            if (resumeText.length() > 3000) {
                resumeText = resumeText.substring(0, 3000) + "\n\n[Resume content truncated for analysis...]";
            }

            // Build single job context
            String jobContext = buildSingleJobContext(job);

            // Use OpenAI to analyze match
            JobMatch match = analyzeSingleJobMatchWithAI(resumeText, jobContext, job);

            return match;

        } catch (Exception e) {
            throw new RuntimeException("Error matching resume with job: " + e.getMessage(), e);
        }
    }

    private String extractResumeText(MultipartFile resumeFile) {
        try {
            // Use Apache Tika to extract text from PDF, DOC, DOCX, and other formats
            AutoDetectParser parser = new AutoDetectParser();
            BodyContentHandler handler = new BodyContentHandler(1000000); // Limit to 1MB of text
            Metadata metadata = new Metadata();
            
            // Parse the file
            try (InputStream inputStream = resumeFile.getInputStream()) {
                parser.parse(inputStream, handler, metadata);
            }
            
            String extractedText = handler.toString();
            
            // Validate that we actually extracted text
            if (extractedText == null || extractedText.trim().isEmpty()) {
                throw new RuntimeException("Failed to extract text from resume. The file may be corrupted, password-protected, or contain only images.");
            }
            
            // Clean up the text - remove excessive whitespace but preserve structure
            extractedText = extractedText.replaceAll("\\s+", " ").trim();
            
            // Ensure we have meaningful content (at least 50 characters)
            if (extractedText.length() < 50) {
                throw new RuntimeException("Resume appears to be empty or contains very little text. Please ensure the resume has readable text content.");
            }
            
            return extractedText;

        } catch (IOException e) {
            throw new RuntimeException("Error reading resume file: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Error extracting text from resume: " + e.getMessage(), e);
        }
    }

    private String buildJobsContext(List<Job> jobs) {
        StringBuilder context = new StringBuilder();
        context.append("JOBS:\n");
        
        for (Job job : jobs) {
            // Truncate skills
            String skills = job.getSkillsname();
            if (skills != null && skills.length() > 50) {
                skills = skills.substring(0, 50) + "...";
            }
            
            // Truncate description (max 200 chars)
            String desc = job.getJobDiscription();
            if (desc != null && desc.length() > 200) {
                desc = desc.substring(0, 200) + "...";
            }
            
            // Compact format
            context.append(String.format("ID:%d Title:%s Location:%s Skills:%s Exp:%s Salary:%s Desc:%s\n",
                job.getId(),
                job.getJobName() != null ? job.getJobName() : "N/A",
                job.getJobLocation() != null ? job.getJobLocation() : "N/A",
                skills != null ? skills : "N/A",
                job.getJobExperience() != null ? job.getJobExperience() : "N/A",
                job.getJobSalaryRange() != null ? job.getJobSalaryRange() : "N/A",
                desc != null ? desc : "N/A"));
        }
        
        return context.toString();
    }

    private String buildSingleJobContext(Job job) {
        StringBuilder context = new StringBuilder();
        context.append("JOB REQUIREMENTS:\n");
        context.append(String.format("ID:%d Title:%s Location:%s\n", 
            job.getId(),
            job.getJobName() != null ? job.getJobName() : "N/A",
            job.getJobLocation() != null ? job.getJobLocation() : "N/A"));
        context.append(String.format("Skills:%s Experience:%s Salary:%s Type:%s\n",
            job.getSkillsname() != null ? job.getSkillsname() : "N/A",
            job.getJobExperience() != null ? job.getJobExperience() : "N/A",
            job.getJobSalaryRange() != null ? job.getJobSalaryRange() : "N/A",
            job.getJobType() != null ? job.getJobType().toString() : "N/A"));
        
        // Truncate job description to save tokens (max 500 chars)
        String jobDesc = job.getJobDiscription();
        if (jobDesc != null && !jobDesc.trim().isEmpty()) {
            if (jobDesc.length() > 500) {
                jobDesc = jobDesc.substring(0, 500) + "...";
            }
            context.append("Description:").append(jobDesc).append("\n");
        }
        
        // Truncate roles and responsibilities (max 300 chars)
        String roles = job.getRolesAndResponsibilities();
        if (roles != null && !roles.trim().isEmpty()) {
            if (roles.length() > 300) {
                roles = roles.substring(0, 300) + "...";
            }
            context.append("Responsibilities:").append(roles).append("\n");
        }
        
        return context.toString();
    }

    private List<JobMatch> analyzeMatchesWithAI(String resumeText, String jobsContext, List<Job> jobs) {
        try {
            OpenAiService service = new OpenAiService(openaiApiKey, Duration.ofSeconds(timeoutSeconds));

            // Validate resume text
            if (resumeText == null || resumeText.trim().isEmpty() || resumeText.trim().length() < 50) {
                throw new RuntimeException("Resume text is empty or too short. Please ensure the resume contains readable text.");
            }

            // Concise system prompt to save tokens
            String systemPrompt = "You are a recruiter analyzing resume vs jobs. " +
                    "Rules: Read actual resume. Empty resume = 0-10% scores. " +
                    "Be strict: missing skills = lower scores. " +
                    "80%+ = meets most requirements, 50-79% = some gaps, 0-49% = lacks key requirements. " +
                    "Return JSON: {\"matches\":[{\"jobId\":number, \"matchScore\":number, \"matchReason\":string, \"strengths\":string, \"gaps\":string}]}";

            // Truncate resume text aggressively (max 2000 chars)
            String truncatedResume = resumeText.length() > 2000 
                ? resumeText.substring(0, 2000) + "\n\n[Truncated...]"
                : resumeText;

            // Concise user prompt
            String userPrompt = "RESUME:\n" + truncatedResume + 
                    "\n\nJOBS:\n" + jobsContext + 
                    "\n\nAnalyze match for each job. Empty resume = 0-10% scores. Return JSON: {\"matches\":[{\"jobId\":number, \"matchScore\":number, \"matchReason\":string, \"strengths\":string, \"gaps\":string}]}";

            List<ChatMessage> messages = new ArrayList<>();
            messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt));
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), userPrompt));

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(openaiModel)
                    .messages(messages)
                    .maxTokens(maxTokens)
                    .temperature(temperature)
                    .build();

            var completionResult = service.createChatCompletion(request);
            
            if (completionResult == null || completionResult.getChoices() == null || completionResult.getChoices().isEmpty()) {
                throw new RuntimeException("OpenAI returned empty response");
            }

            String responseText = completionResult.getChoices().get(0).getMessage().getContent();
            
            // Parse JSON response
            return parseAIResponse(responseText, jobs);

        } catch (Exception e) {
            String errorMessage = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            
            // Check for rate limit errors
            if (errorMessage.contains("rate limit") || errorMessage.contains("429") || 
                errorMessage.contains("tpm") || errorMessage.contains("tokens per min") ||
                errorMessage.contains("quota") || errorMessage.contains("billing")) {
                throw new RuntimeException("⚠️ Rate Limit Exceeded\n\n" +
                    "OpenAI API rate limit has been reached. " +
                    "Please wait 2-3 minutes before trying again. " +
                    "To avoid this:\n" +
                    "1. Wait longer between resume matching requests\n" +
                    "2. Upgrade your OpenAI plan for higher rate limits\n" +
                    "3. Reduce the number of active jobs\n\n" +
                    "Error details: " + e.getMessage());
            }
            
            throw new RuntimeException("Error analyzing matches with AI: " + e.getMessage(), e);
        }
    }

    private List<JobMatch> parseAIResponse(String responseText, List<Job> jobs) {
        List<JobMatch> matches = new ArrayList<>();
        
        try {
            // Extract JSON from response (might have markdown code blocks)
            String jsonText = responseText.trim();
            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.substring(7);
            }
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.substring(3);
            }
            if (jsonText.endsWith("```")) {
                jsonText = jsonText.substring(0, jsonText.length() - 3);
            }
            jsonText = jsonText.trim();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonText);
            JsonNode matchesNode = root.get("matches");

            if (matchesNode != null && matchesNode.isArray()) {
                // Create a map of job IDs to jobs for quick lookup
                var jobMap = jobs.stream()
                        .collect(Collectors.toMap(Job::getId, job -> job));

                for (JsonNode matchNode : matchesNode) {
                    Long jobId = matchNode.get("jobId").asLong();
                    Job job = jobMap.get(jobId);
                    
                    if (job != null) {
                        JobMatch match = new JobMatch();
                        match.setJobId(jobId);
                        match.setJobName(job.getJobName());
                        match.setJobLocation(job.getJobLocation());
                        match.setSkills(job.getSkillsname());
                        match.setExperience(job.getJobExperience());
                        match.setSalaryRange(job.getJobSalaryRange());
                        match.setClientName(job.getClient() != null && job.getClient().getClientName() != null 
                                ? job.getClient().getClientName() : "N/A");
                        match.setMatchScore(matchNode.get("matchScore").asDouble());
                        match.setMatchReason(matchNode.has("matchReason") ? matchNode.get("matchReason").asText() : "");
                        match.setStrengths(matchNode.has("strengths") ? matchNode.get("strengths").asText() : "");
                        match.setGaps(matchNode.has("gaps") ? matchNode.get("gaps").asText() : "");
                        
                        matches.add(match);
                    }
                }
            }

            // If no matches were parsed, create matches for all jobs with default scores
            if (matches.isEmpty()) {
                for (Job job : jobs) {
                    JobMatch match = new JobMatch();
                    match.setJobId(job.getId());
                    match.setJobName(job.getJobName());
                    match.setJobLocation(job.getJobLocation());
                    match.setSkills(job.getSkillsname());
                    match.setExperience(job.getJobExperience());
                    match.setSalaryRange(job.getJobSalaryRange());
                    match.setClientName(job.getClient() != null && job.getClient().getClientName() != null 
                            ? job.getClient().getClientName() : "N/A");
                    match.setMatchScore(50.0); // Default score
                    match.setMatchReason("Analysis pending");
                    match.setStrengths("To be determined");
                    match.setGaps("To be determined");
                    matches.add(match);
                }
            }

        } catch (Exception e) {
            // If parsing fails, create default matches for all jobs
            System.err.println("Error parsing AI response: " + e.getMessage());
            for (Job job : jobs) {
                JobMatch match = new JobMatch();
                match.setJobId(job.getId());
                match.setJobName(job.getJobName());
                match.setJobLocation(job.getJobLocation());
                match.setSkills(job.getSkillsname());
                match.setExperience(job.getJobExperience());
                match.setSalaryRange(job.getJobSalaryRange());
                match.setClientName(job.getClient() != null && job.getClient().getClientName() != null 
                        ? job.getClient().getClientName() : "N/A");
                match.setMatchScore(50.0);
                match.setMatchReason("Error parsing AI response: " + e.getMessage());
                match.setStrengths("N/A");
                match.setGaps("N/A");
                matches.add(match);
            }
        }

        return matches;
    }

    private JobMatch analyzeSingleJobMatchWithAI(String resumeText, String jobContext, Job job) {
        try {
            // Validate resume text is not empty
            if (resumeText == null || resumeText.trim().isEmpty() || resumeText.trim().length() < 50) {
                throw new RuntimeException("Resume text is empty or too short. Please ensure the resume contains readable text.");
            }

            OpenAiService service = new OpenAiService(openaiApiKey, Duration.ofSeconds(timeoutSeconds));

            // Concise system prompt to save tokens
            String systemPrompt = "You are a recruiter analyzing resume vs job match. " +
                    "Rules: Read actual resume content. Empty resume = 0-10% score. " +
                    "Be strict: missing skills/experience = lower scores. " +
                    "80%+ = meets most requirements, 50-79% = some gaps, 0-49% = lacks key requirements. " +
                    "Return JSON: {\"matchScore\":number, \"matchReason\":string, \"strengths\":string, \"gaps\":string}";

            // Truncate resume text aggressively to reduce tokens (max 2000 chars)
            String truncatedResume = resumeText.length() > 2000 
                ? resumeText.substring(0, 2000) + "\n\n[Resume truncated...]"
                : resumeText;

            // Concise user prompt
            String userPrompt = "RESUME:\n" + truncatedResume + 
                    "\n\nJOB:\n" + jobContext + 
                    "\n\nAnalyze match. Empty resume = 0-10%. Return JSON: {\"matchScore\":number, \"matchReason\":string, \"strengths\":string, \"gaps\":string}";

            List<ChatMessage> messages = new ArrayList<>();
            messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt));
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), userPrompt));

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                    .model(openaiModel)
                    .messages(messages)
                    .maxTokens(maxTokens)
                    .temperature(temperature)
                    .build();

            var completionResult = service.createChatCompletion(request);
            
            if (completionResult == null || completionResult.getChoices() == null || completionResult.getChoices().isEmpty()) {
                throw new RuntimeException("OpenAI returned empty response");
            }

            String responseText = completionResult.getChoices().get(0).getMessage().getContent();
            
            // Parse JSON response
            return parseSingleJobMatchResponse(responseText, job);

        } catch (Exception e) {
            String errorMessage = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            
            // Check for rate limit errors
            if (errorMessage.contains("rate limit") || errorMessage.contains("429") || 
                errorMessage.contains("tpm") || errorMessage.contains("tokens per min") ||
                errorMessage.contains("quota") || errorMessage.contains("billing")) {
                throw new RuntimeException("⚠️ Rate Limit Exceeded\n\n" +
                    "OpenAI API rate limit has been reached. " +
                    "Please wait 2-3 minutes before trying again. " +
                    "To avoid this:\n" +
                    "1. Wait longer between resume matching requests\n" +
                    "2. Upgrade your OpenAI plan for higher rate limits\n" +
                    "3. Reduce the number of active jobs being analyzed\n\n" +
                    "Error details: " + e.getMessage());
            }
            
            throw new RuntimeException("Error analyzing single job match with AI: " + e.getMessage(), e);
        }
    }

    private JobMatch parseSingleJobMatchResponse(String responseText, Job job) {
        try {
            // Extract JSON from response (might have markdown code blocks)
            String jsonText = responseText.trim();
            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.substring(7);
            }
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.substring(3);
            }
            if (jsonText.endsWith("```")) {
                jsonText = jsonText.substring(0, jsonText.length() - 3);
            }
            jsonText = jsonText.trim();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonText);

            JobMatch match = new JobMatch();
            match.setJobId(job.getId());
            match.setJobName(job.getJobName());
            match.setJobLocation(job.getJobLocation());
            match.setSkills(job.getSkillsname());
            match.setExperience(job.getJobExperience());
            match.setSalaryRange(job.getJobSalaryRange());
            match.setClientName(job.getClient() != null && job.getClient().getClientName() != null 
                    ? job.getClient().getClientName() : "N/A");
            match.setMatchScore(root.has("matchScore") ? root.get("matchScore").asDouble() : 50.0);
            match.setMatchReason(root.has("matchReason") ? root.get("matchReason").asText() : "Analysis pending");
            match.setStrengths(root.has("strengths") ? root.get("strengths").asText() : "To be determined");
            match.setGaps(root.has("gaps") ? root.get("gaps").asText() : "To be determined");
            
            return match;

        } catch (Exception e) {
            // If parsing fails, create default match
            System.err.println("Error parsing AI response: " + e.getMessage());
            JobMatch match = new JobMatch();
            match.setJobId(job.getId());
            match.setJobName(job.getJobName());
            match.setJobLocation(job.getJobLocation());
            match.setSkills(job.getSkillsname());
            match.setExperience(job.getJobExperience());
            match.setSalaryRange(job.getJobSalaryRange());
            match.setClientName(job.getClient() != null && job.getClient().getClientName() != null 
                    ? job.getClient().getClientName() : "N/A");
            match.setMatchScore(50.0);
            match.setMatchReason("Error parsing AI response: " + e.getMessage());
            match.setStrengths("N/A");
            match.setGaps("N/A");
            return match;
        }
    }
}

