package com.example.Material_Mitra.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.repository.CandidateRepository;
import com.example.Material_Mitra.repository.JobApplicationRepository;
import com.example.Material_Mitra.repository.JobRepository;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;

@Service
public class ChatbotService {

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Value("${openai.api-key}")
    private String openaiApiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String openaiModel;

    @Value("${openai.max-tokens:1000}")
    private Integer maxTokens;

    @Value("${openai.temperature:0.7}")
    private Double temperature;

    @Value("${openai.timeout-seconds:30}")
    private Integer timeoutSeconds;

    @Value("${openai.context-max-records:30}")
    private Integer maxContextRecords;

    // Cache for database context to avoid repeated fetches
    private String cachedContext = null;
    private long contextCacheTime = 0;
    private static final long CONTEXT_CACHE_DURATION_MS = 60000; // Cache for 1 minute

    // Track last request time to add delay between requests
    private long lastRequestTime = 0;
    private static final long MIN_REQUEST_INTERVAL_MS = 2000; // Minimum 2 seconds between requests

    public String processMessage(String userMessage) {
        try {
            // Validate API key
            if (openaiApiKey == null || openaiApiKey.trim().isEmpty() || openaiApiKey.equals("your-openai-api-key-here")) {
                System.err.println("ERROR: OpenAI API key is not configured. Please set openai.api-key in application.properties");
                return "OpenAI API key is not configured. Please contact your administrator to set up the API key in application.properties";
            }

            // Add delay between requests to prevent rate limiting
            long currentTime = System.currentTimeMillis();
            long timeSinceLastRequest = currentTime - lastRequestTime;
            if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
                try {
                    Thread.sleep(MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            lastRequestTime = System.currentTimeMillis();

            // Get database context (use cache if available and fresh)
            String databaseContext = getDatabaseContext();

            // Create system prompt with database schema and context
            String systemPrompt = buildSystemPrompt(databaseContext);

            System.out.println("Initializing OpenAI service with model: " + openaiModel);
            
            // Initialize OpenAI service with timeout
            OpenAiService service = new OpenAiService(openaiApiKey, Duration.ofSeconds(timeoutSeconds));

            // Build messages
            List<ChatMessage> messages = new ArrayList<>();
            messages.add(new ChatMessage(ChatMessageRole.SYSTEM.value(), systemPrompt));
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), userMessage));

            System.out.println("Sending request to OpenAI...");

            // Create completion request
            ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
                    .model(openaiModel)
                    .messages(messages)
                    .maxTokens(maxTokens)
                    .temperature(temperature)
                    .build();

            // Get response from OpenAI
            var completionResult = service.createChatCompletion(completionRequest);
            
            if (completionResult == null || completionResult.getChoices() == null || completionResult.getChoices().isEmpty()) {
                System.err.println("ERROR: OpenAI returned empty response");
                return "I received an empty response from OpenAI. Please try again.";
            }

            ChatMessage responseMessage = completionResult.getChoices().get(0).getMessage();
            
            if (responseMessage == null || responseMessage.getContent() == null) {
                System.err.println("ERROR: OpenAI response message is null");
                return "I received an invalid response from OpenAI. Please try again.";
            }

            System.out.println("Successfully received response from OpenAI");
            return responseMessage.getContent().trim();

        } catch (Exception e) {
            // Check for specific error types in the message
            String errorMessage = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            
            // Check for API key errors (401, unauthorized, incorrect key)
            if (errorMessage.contains("401") || errorMessage.contains("unauthorized") || 
                errorMessage.contains("authentication") || 
                errorMessage.contains("incorrect api key") ||
                errorMessage.contains("incorrect api key provided")) {
                System.err.println("OpenAI Authentication Error: " + e.getMessage());
                return "❌ Invalid OpenAI API Key\n\n" +
                       "The API key in your application.properties is incorrect or expired.\n\n" +
                       "To fix this:\n" +
                       "1. Go to https://platform.openai.com/api-keys\n" +
                       "2. Sign in to your OpenAI account\n" +
                       "3. Create a new API key or use an existing valid one\n" +
                       "4. Update 'openai.api-key' in application.properties\n" +
                       "5. Restart the Spring Boot application";
            } else if (errorMessage.contains("429") || errorMessage.contains("rate limit") || 
                       errorMessage.contains("rate_limit_exceeded") || 
                       errorMessage.contains("quota") || 
                       errorMessage.contains("billing")) {
                System.err.println("OpenAI Rate Limit Error: " + e.getMessage());
                return "⚠️ Rate Limit Exceeded\n\n" +
                       "OpenAI API rate limit has been exceeded. This can happen when:\n" +
                       "• Too many requests in a short time\n" +
                       "• Large database context (1000+ candidates)\n" +
                       "• API quota limits reached\n\n" +
                       "Solutions:\n" +
                       "1. Wait 1-2 minutes and try again\n" +
                       "2. Upgrade your OpenAI plan for higher rate limits\n" +
                       "3. Reduce database size or optimize context\n" +
                       "4. Try asking more specific questions instead of broad queries";
            } else if (errorMessage.contains("500") || errorMessage.contains("server error")) {
                System.err.println("OpenAI Server Error: " + e.getMessage());
                return "OpenAI service is temporarily unavailable. Please try again later.";
            } else if (errorMessage.contains("timeout") || e instanceof java.util.concurrent.TimeoutException) {
                System.err.println("Timeout error: " + e.getMessage());
                return "Request timed out. Please check your internet connection and try again.";
            } else if (errorMessage.contains("unknown host") || e instanceof java.net.UnknownHostException) {
                System.err.println("Network error: " + e.getMessage());
                return "Network error: Unable to connect to OpenAI. Please check your internet connection.";
            }
            System.err.println("Unexpected error in ChatbotService: " + e.getClass().getName());
            System.err.println("Error message: " + e.getMessage());
            e.printStackTrace();
            return "I encountered an error while processing your request: " + e.getMessage() + ". Please try again or contact support.";
        }
    }

    private String buildSystemPrompt(String databaseContext) {
        // Concise system prompt to save tokens
        return "You are an AI assistant for TalentPrime ATS. Answer questions about the ATS system using the database context below. " +
                "For general questions, use your knowledge. Be conversational and helpful.\n\n" +
                "DATABASE CONTEXT:\n" + databaseContext + "\n\n" +
                "Use the context above only for ATS-related questions. For other topics, use your general knowledge.";
    }

    private String getDatabaseContext() {
        // Check cache first
        long currentTime = System.currentTimeMillis();
        if (cachedContext != null && (currentTime - contextCacheTime) < CONTEXT_CACHE_DURATION_MS) {
            return cachedContext;
        }

        StringBuilder context = new StringBuilder();

        try {
            // Get summary statistics (fast, no data transfer)
            long totalCandidates = candidateRepository.count();
            long totalJobs = jobRepository.count();
            long totalApplications = jobApplicationRepository.count();

            context.append("SUMMARY: Candidates:").append(totalCandidates)
                   .append(" Jobs:").append(totalJobs)
                   .append(" Applications:").append(totalApplications).append("\n\n");

            // Limit records to prevent rate limits - only get most recent records
            // Aggressively limit to prevent rate limits
            int maxRecords = maxContextRecords != null ? maxContextRecords : 30;
            
            // Get LIMITED candidates (most recent first) - only essential fields
            List<Candidate> candidates = candidateRepository.findAll()
                    .stream()
                    .sorted((a, b) -> {
                        if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                        if (a.getCreatedAt() == null) return 1;
                        if (b.getCreatedAt() == null) return -1;
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    })
                    .limit(maxRecords)
                    .collect(Collectors.toList());

            if (!candidates.isEmpty()) {
                context.append("RECENT CANDIDATES (").append(candidates.size()).append(" of ").append(totalCandidates).append("):\n");
                for (Candidate candidate : candidates) {
                    // Truncate long fields aggressively to save tokens
                    String skills = candidate.getSkills();
                    if (skills != null && skills.length() > 50) {
                        skills = skills.substring(0, 50) + "...";
                    }
                    
                    // Only include essential fields - minimal token usage
                    context.append(String.format("ID:%d Name:%s Email:%s Status:%s Skills:%s\n",
                            candidate.getId(),
                            candidate.getName() != null ? candidate.getName() : "N/A",
                            candidate.getEmail() != null ? candidate.getEmail() : "N/A",
                            candidate.getStatus() != null ? candidate.getStatus().toString() : "N/A",
                            skills != null ? skills : "N/A"));
                }
                context.append("\n");
            }

            // Get LIMITED jobs (most recent first)
            List<Job> jobs = jobRepository.findAll()
                    .stream()
                    .sorted((a, b) -> {
                        if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                        if (a.getCreatedAt() == null) return 1;
                        if (b.getCreatedAt() == null) return -1;
                        return b.getCreatedAt().compareTo(a.getCreatedAt());
                    })
                    .limit(maxRecords)
                    .collect(Collectors.toList());

            if (!jobs.isEmpty()) {
                context.append("RECENT JOBS (").append(jobs.size()).append(" of ").append(totalJobs).append("):\n");
                for (Job job : jobs) {
                    // Truncate long fields aggressively
                    String skills = job.getSkillsname();
                    if (skills != null && skills.length() > 50) {
                        skills = skills.substring(0, 50) + "...";
                    }
                    
                    // Only include essential fields
                    context.append(String.format("ID:%d Title:%s Location:%s Status:%s Skills:%s\n",
                            job.getId(),
                            job.getJobName() != null ? job.getJobName() : "N/A",
                            job.getJobLocation() != null ? job.getJobLocation() : "N/A",
                            job.getStatus() != null ? job.getStatus().toString() : "N/A",
                            skills != null ? skills : "N/A"));
                }
                context.append("\n");
            }

            // Get LIMITED applications (most recent first)
            List<JobApplication> applications = jobApplicationRepository.findAll()
                    .stream()
                    .sorted((a, b) -> {
                        if (a.getAppliedAt() == null && b.getAppliedAt() == null) return 0;
                        if (a.getAppliedAt() == null) return 1;
                        if (b.getAppliedAt() == null) return -1;
                        return b.getAppliedAt().compareTo(a.getAppliedAt());
                    })
                    .limit(maxRecords)
                    .collect(Collectors.toList());

            if (!applications.isEmpty()) {
                context.append("RECENT APPLICATIONS (").append(applications.size()).append(" of ").append(totalApplications).append("):\n");
                for (JobApplication app : applications) {
                    // Minimal format to save tokens
                    context.append(String.format("ID:%d Candidate:%s Job:%s Status:%s\n",
                            app.getId(),
                            app.getCandidate() != null && app.getCandidate().getName() != null
                                    ? app.getCandidate().getName() : "N/A",
                            app.getJob() != null && app.getJob().getJobName() != null
                                    ? app.getJob().getJobName() : "N/A",
                            app.getStatus() != null ? app.getStatus().toString() : "N/A"));
                }
                context.append("\n");
            }

            // Get status distribution (efficient - uses aggregation)
            Map<String, Long> candidateStatusCount = candidateRepository.findAll()
                    .stream()
                    .collect(Collectors.groupingBy(
                            c -> c.getStatus() != null ? c.getStatus().toString() : "UNKNOWN",
                            Collectors.counting()));

            // Only include status distribution if it's small (to save tokens)
            if (!candidateStatusCount.isEmpty() && candidateStatusCount.size() <= 10) {
                context.append("CANDIDATE STATUS:\n");
                candidateStatusCount.forEach((status, count) ->
                        context.append(String.format("%s:%d ", status, count)));
                context.append("\n\n");
            }

            // Get status distribution for applications (only if small)
            Map<String, Long> applicationStatusCount = jobApplicationRepository.findAll()
                    .stream()
                    .collect(Collectors.groupingBy(
                            a -> a.getStatus() != null ? a.getStatus().toString() : "UNKNOWN",
                            Collectors.counting()));

            if (!applicationStatusCount.isEmpty() && applicationStatusCount.size() <= 10) {
                context.append("APPLICATION STATUS:\n");
                applicationStatusCount.forEach((status, count) ->
                        context.append(String.format("%s:%d ", status, count)));
                context.append("\n\n");
            }

        } catch (Exception e) {
            context.append("Error retrieving database context: ").append(e.getMessage());
        }

        // Cache the context
        String result = context.toString();
        cachedContext = result;
        contextCacheTime = System.currentTimeMillis();

        return result;
    }

    public String queryDatabase(String query) {
        // This method can be extended to handle specific database queries
        // For now, it returns the context
        return getDatabaseContext();
    }

}

