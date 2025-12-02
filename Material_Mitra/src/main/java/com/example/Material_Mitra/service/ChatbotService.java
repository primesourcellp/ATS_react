package com.example.Material_Mitra.service;

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

    public String processMessage(String userMessage) {
        try {
            // Validate API key
            if (openaiApiKey == null || openaiApiKey.trim().isEmpty() || openaiApiKey.equals("your-openai-api-key-here")) {
                System.err.println("ERROR: OpenAI API key is not configured. Please set openai.api-key in application.properties");
                return "OpenAI API key is not configured. Please contact your administrator to set up the API key in application.properties";
            }

            // Always get database context so OpenAI has access to all data
            String databaseContext = getDatabaseContext();

            // Create system prompt with database schema and context
            String systemPrompt = buildSystemPrompt(databaseContext);

            System.out.println("Initializing OpenAI service with model: " + openaiModel);
            
            // Initialize OpenAI service
            OpenAiService service = new OpenAiService(openaiApiKey);

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
            } else if (errorMessage.contains("429") || errorMessage.contains("rate limit")) {
                System.err.println("OpenAI Rate Limit Error: " + e.getMessage());
                return "Rate limit exceeded. Please wait a moment and try again.";
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
        return "You are an intelligent AI assistant integrated into TalentPrime, a Talent Acquisition System (ATS). " +
                "You are designed to be helpful, knowledgeable, and conversational - similar to ChatGPT. " +
                "\n\n" +
                "YOUR CAPABILITIES:\n" +
                "1. Answer ANY question the user asks - whether it's about the ATS system, general knowledge, coding, " +
                "   business, technology, or any other topic.\n" +
                "2. When questions relate to the TalentPrime ATS database, use the provided context below.\n" +
                "3. For general questions (not related to the database), use your knowledge to provide helpful answers.\n" +
                "4. Be conversational, friendly, and helpful in all interactions.\n" +
                "5. Format information clearly with proper structure (lists, paragraphs, etc.).\n" +
                "6. If you don't know something, admit it honestly.\n" +
                "\n\n" +
                "TALENTPRIME ATS DATABASE CONTEXT:\n" +
                "(Use this information ONLY when answering questions about the ATS system, candidates, jobs, or applications)\n" +
                databaseContext +
                "\n\n" +
                "RESPONSE GUIDELINES:\n" +
                "- For ATS-related questions: Use the database context provided above.\n" +
                "- For general questions: Use your knowledge to provide accurate, helpful answers.\n" +
                "- Be natural and conversational - like ChatGPT.\n" +
                "- If asked about data not in the context, say so clearly.\n" +
                "- Always be helpful, accurate, and friendly.\n" +
                "- Format responses in a readable, well-structured manner.";
    }

    private String getDatabaseContext() {
        StringBuilder context = new StringBuilder();

        try {
            // Get summary statistics
            long totalCandidates = candidateRepository.count();
            long totalJobs = jobRepository.count();
            long totalApplications = jobApplicationRepository.count();

            context.append("DATABASE SUMMARY:\n");
            context.append("- Total Candidates: ").append(totalCandidates).append("\n");
            context.append("- Total Jobs: ").append(totalJobs).append("\n");
            context.append("- Total Applications: ").append(totalApplications).append("\n\n");

            // Get ALL candidates
            List<Candidate> allCandidates = candidateRepository.findAll();

            if (!allCandidates.isEmpty()) {
                context.append("ALL CANDIDATES:\n");
                for (Candidate candidate : allCandidates) {
                    context.append(String.format("- ID: %d, Name: %s, Email: %s, Phone: %s, Status: %s, Location: %s, Experience: %s, Skills: %s, Created: %s, CreatedBy: %s\n",
                            candidate.getId(),
                            candidate.getName() != null ? candidate.getName() : "N/A",
                            candidate.getEmail() != null ? candidate.getEmail() : "N/A",
                            candidate.getPhone() != null ? candidate.getPhone() : "N/A",
                            candidate.getStatus() != null ? candidate.getStatus().toString() : "N/A",
                            candidate.getLocation() != null ? candidate.getLocation() : "N/A",
                            candidate.getExperience() != null ? candidate.getExperience().toString() : "N/A",
                            candidate.getSkills() != null ? candidate.getSkills() : "N/A",
                            candidate.getCreatedAt() != null ? candidate.getCreatedAt().toString() : "N/A",
                            candidate.getCreatedByName() != null ? candidate.getCreatedByName() : "N/A"));
                }
                context.append("\n");
            }

            // Get ALL jobs
            List<Job> allJobs = jobRepository.findAll();

            if (!allJobs.isEmpty()) {
                context.append("ALL JOBS:\n");
                for (Job job : allJobs) {
                    context.append(String.format("- ID: %d, Title: %s, Location: %s, Status: %s, Client: %s, Experience: %s, Skills: %s, Salary: %s, Type: %s, Created: %s\n",
                            job.getId(),
                            job.getJobName() != null ? job.getJobName() : "N/A",
                            job.getJobLocation() != null ? job.getJobLocation() : "N/A",
                            job.getStatus() != null ? job.getStatus().toString() : "N/A",
                            job.getClient() != null && job.getClient().getClientName() != null
                                    ? job.getClient().getClientName() : "N/A",
                            job.getJobExperience() != null ? job.getJobExperience() : "N/A",
                            job.getSkillsname() != null ? job.getSkillsname() : "N/A",
                            job.getJobSalaryRange() != null ? job.getJobSalaryRange() : "N/A",
                            job.getJobType() != null ? job.getJobType().toString() : "N/A",
                            job.getCreatedAt() != null ? job.getCreatedAt().toString() : "N/A"));
                }
                context.append("\n");
            }

            // Get ALL applications
            List<JobApplication> allApplications = jobApplicationRepository.findAll();

            if (!allApplications.isEmpty()) {
                context.append("ALL APPLICATIONS:\n");
                for (JobApplication app : allApplications) {
                    context.append(String.format("- ID: %d, Candidate: %s (ID: %d), Job: %s (ID: %d), Status: %s, Applied: %s, CreatedBy: %s, HasResume: %s\n",
                            app.getId(),
                            app.getCandidate() != null && app.getCandidate().getName() != null
                                    ? app.getCandidate().getName() : "N/A",
                            app.getCandidate() != null ? app.getCandidate().getId() : -1,
                            app.getJob() != null && app.getJob().getJobName() != null
                                    ? app.getJob().getJobName() : "N/A",
                            app.getJob() != null ? app.getJob().getId() : -1,
                            app.getStatus() != null ? app.getStatus().toString() : "N/A",
                            app.getAppliedAt() != null ? app.getAppliedAt().toString() : "N/A",
                            app.getCreatedByName() != null ? app.getCreatedByName() : "N/A",
                            app.getApplicationResumePath() != null ? "Yes" : "No"));
                }
                context.append("\n");
            }

            // Get status distribution for candidates
            Map<String, Long> candidateStatusCount = candidateRepository.findAll()
                    .stream()
                    .collect(Collectors.groupingBy(
                            c -> c.getStatus() != null ? c.getStatus().toString() : "UNKNOWN",
                            Collectors.counting()));

            if (!candidateStatusCount.isEmpty()) {
                context.append("CANDIDATE STATUS DISTRIBUTION:\n");
                candidateStatusCount.forEach((status, count) ->
                        context.append(String.format("- %s: %d\n", status, count)));
                context.append("\n");
            }

            // Get status distribution for applications
            Map<String, Long> applicationStatusCount = jobApplicationRepository.findAll()
                    .stream()
                    .collect(Collectors.groupingBy(
                            a -> a.getStatus() != null ? a.getStatus().toString() : "UNKNOWN",
                            Collectors.counting()));

            if (!applicationStatusCount.isEmpty()) {
                context.append("APPLICATION STATUS DISTRIBUTION:\n");
                applicationStatusCount.forEach((status, count) ->
                        context.append(String.format("- %s: %d\n", status, count)));
                context.append("\n");
            }

        } catch (Exception e) {
            context.append("Error retrieving database context: ").append(e.getMessage());
        }

        return context.toString();
    }

    public String queryDatabase(String query) {
        // This method can be extended to handle specific database queries
        // For now, it returns the context
        return getDatabaseContext();
    }

}

