package com.example.Material_Mitra.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.Material_Mitra.dto.InterviewDTO;
import com.example.Material_Mitra.dto.InterviewDetailDTO;
import com.example.Material_Mitra.dto.InterviewListDTO;
import com.example.Material_Mitra.dto.InterviewPatchDTO;
import com.example.Material_Mitra.dto.InterviewUpdateDTO;
import com.example.Material_Mitra.dto.StatusHistoryDTO;
import com.example.Material_Mitra.entity.Interview;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.enums.InterviewStatus;
import com.example.Material_Mitra.enums.ResultStatus;
import com.example.Material_Mitra.enums.RoleStatus;
import com.example.Material_Mitra.repository.ApplicationStatusHistoryRepository;
import com.example.Material_Mitra.repository.InterviewRepository;
import com.example.Material_Mitra.repository.JobApplicationRepository;
import com.example.Material_Mitra.repository.UserRepository;

@Service
public class InterviewService {

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobApplicationService jobApplicationService;

    @Autowired
    private ApplicationStatusHistoryRepository statusHistoryRepository;

    public Interview getInterviewById(Long id) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found"));
        // Auto-complete if past due
        autoCompleteIfPastDue(interview);
        return interview;
    }
//    public List<Interview> getAll() {
//        return interviewRepository.findAll();
//    }


//    public List<Interview> getAllInterviews() {
//        return interviewRepository.findAll();
//    }
//    public List<InterviewDTO> getAllInterviews() {
//        return interviewRepository.getAllInterviewsWithClient();
//    }

    public List<Interview> getInterviewsByDate(LocalDate date) {
        List<Interview> interviews = interviewRepository.findByInterviewDate(date);
        // Auto-complete past interviews
        interviews.forEach(this::autoCompleteIfPastDue);
        return interviews;
    }

    public Interview updateInterview(Long id, Interview updatedInterview) {
        Interview existing = getInterviewById(id);

        existing.setInterviewDate(updatedInterview.getInterviewDate());
        existing.setInterviewTime(updatedInterview.getInterviewTime());
        existing.setEndTime(updatedInterview.getEndTime());

        return interviewRepository.save(existing);
    }

    public void deleteInterview(Long id) {
        interviewRepository.deleteById(id);
    }

    public Page<InterviewListDTO> getFilteredInterviews(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // Check if search term is a numeric ID
        if (search != null && !search.trim().isEmpty()) {
            try {
                Long interviewId = Long.parseLong(search.trim());
                // Search by ID
                Page<InterviewListDTO> resultById = interviewRepository.searchInterviewsById(interviewId, pageable);
                if (resultById.hasContent()) {
                    return resultById;
                }
            } catch (NumberFormatException e) {
                // Not a number, continue with text search
            }
        }
        
        // Search by candidate name or job name
        Page<InterviewListDTO> result = interviewRepository.searchInterviews(search != null ? search : "", pageable);
        // Auto-complete past interviews - need to load and check each interview
        // This is done in the getAllInterviewsWithClient method which loads full interview objects
        return result;
    }


    public Interview scheduleInterview(Long applicationId, Interview interview) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Job Application not found with id: " + applicationId));

        // Check if current user has permission to schedule interview
        // Admins and Secondary Admins can always schedule interviews
        // Regular users can only schedule if they assigned the job
        Optional<User> currentUserOpt = resolveCurrentUser();
        if (currentUserOpt.isPresent()) {
            User currentUser = currentUserOpt.get();
            RoleStatus role = currentUser.getRole();
            
            // Admins and Secondary Admins can always schedule interviews
            if (role != RoleStatus.ADMIN && role != RoleStatus.SECONDARY_ADMIN) {
                // For non-admin users, check if they assigned the job
            String currentUsername = currentUser.getUsername();
            String assignedByUsername = application.getCreatedByName() != null ? application.getCreatedByName() : 
                (application.getCreatedBy() != null ? application.getCreatedBy().getUsername() : null);
            
            if (assignedByUsername == null || !assignedByUsername.trim().equalsIgnoreCase(currentUsername.trim())) {
                throw new RuntimeException("Only the user who assigned this job to the candidate can schedule interviews.");
                }
            }
        }

        interview.setApplication(application);
        interview.setScheduledOn(LocalDate.now());
        currentUserOpt.ifPresent(user -> {
            interview.setScheduledBy(user);
            interview.setScheduledByUserId(user.getId());
            interview.setScheduledByName(user.getUsername());
            interview.setScheduledByEmail(user.getEmail());
        });
        
        // Save the interview first
        Interview savedInterview = interviewRepository.save(interview);
        
        // Automatically update application status to SCHEDULED
        try {
            String statusDescription = interview.getDescription() != null && !interview.getDescription().isEmpty() 
                ? "Interview scheduled: " + interview.getDescription() 
                : "Interview scheduled on " + interview.getInterviewDate();
            jobApplicationService.updateApplication(applicationId, ResultStatus.SCHEDULED, statusDescription, null);
        } catch (Exception e) {
            // Log error but don't fail interview creation if status update fails
            // The interview is already saved, so we continue
            System.err.println("Failed to update application status: " + e.getMessage());
        }
        
        return savedInterview;
    }

    public Interview updateInterview(Long id, InterviewUpdateDTO dto) {
        Interview interview = getInterviewById(id);
        interview.setInterviewDate(dto.getInterviewDate());
        interview.setInterviewTime(dto.getInterviewTime());
        interview.setEndTime(dto.getEndTime());

        if (dto.getApplicationId() != null) {
            JobApplication application = jobApplicationRepository.findById(dto.getApplicationId())
                    .orElseThrow(() -> new RuntimeException("Application not found"));
            interview.setApplication(application);
        }

        return interviewRepository.save(interview);
    }

    public long countTodayInterviews() {
        return interviewRepository.countByInterviewDate(LocalDate.now());
    }
    
    public Interview patchInterview(Long id, InterviewPatchDTO dto) {
        Interview interview = getInterviewById(id);

        if (dto.getApplicationId() != null) {
            JobApplication application = jobApplicationRepository.findById(dto.getApplicationId())
                .orElseThrow(() -> new RuntimeException("Job Application not found"));
            interview.setApplication(application); // ✅ CORRECT
        }

        if (dto.getInterviewDate() != null) {
            interview.setInterviewDate(dto.getInterviewDate());
        }
        if (dto.getInterviewTime() != null) {
            interview.setInterviewTime(dto.getInterviewTime());
        }
        if (dto.getEndTime() != null) {
            interview.setEndTime(dto.getEndTime());
        }
        if (dto.getApplicationId() != null) {
            JobApplication application = jobApplicationRepository.findById(dto.getApplicationId())
                .orElseThrow(() -> new RuntimeException("Job Application not found"));
            interview.setApplication(application);
        }

        return interviewRepository.save(interview);
    }

    public List<InterviewDTO> getAllInterviewsWithClient() {
        Optional<User> currentOpt = resolveCurrentUser();
        User current = currentOpt.orElse(null);
        
        // Auto-complete past interviews first - check all scheduled interviews that are past due
        try {
            List<Interview> scheduledInterviews = interviewRepository.findAll().stream()
                .filter(i -> i.getStatus() == InterviewStatus.SCHEDULED)
                .filter(i -> i.getInterviewDate() != null && i.getEndTime() != null)
                .filter(i -> {
                    LocalDateTime now = LocalDateTime.now();
                    LocalDateTime endDateTime = LocalDateTime.of(i.getInterviewDate(), i.getEndTime());
                    return now.isAfter(endDateTime) || now.isEqual(endDateTime);
                })
                .toList();
            
            scheduledInterviews.forEach(this::autoCompleteIfPastDue);
        } catch (Exception e) {
            System.err.println("Failed to auto-complete past interviews: " + e.getMessage());
        }
        
        // Fetch DTOs from repository (respects permissions)
        List<InterviewDTO> interviews;
        if (current == null ||
            current.getRole() == null ||
            current.getRole() == RoleStatus.ADMIN ||
            current.getRole() == RoleStatus.SECONDARY_ADMIN ||
            !current.isRestrictInterviews()) {
            interviews = interviewRepository.findAllInterviewsWithClient();
        } else {
            interviews = interviewRepository.findAllInterviewsWithClientForRecruiter(current.getId());
        }
        
        // Update status field in DTOs by fetching actual interview entities
        // (Since repository queries return DTOs without status, we need to enrich them)
        List<Long> interviewIds = interviews.stream().map(InterviewDTO::getId).collect(Collectors.toList());
        if (!interviewIds.isEmpty()) {
            List<Interview> actualInterviews = interviewRepository.findAllById(interviewIds);
            java.util.Map<Long, Interview> interviewMap = actualInterviews.stream()
                .collect(Collectors.toMap(Interview::getId, interview -> interview));
            
            interviews.forEach(dto -> {
                Interview interview = interviewMap.get(dto.getId());
                if (interview != null && interview.getStatus() != null) {
                    dto.setStatus(interview.getStatus().name());
                } else {
                    dto.setStatus("SCHEDULED");
                }
            });
        } else {
            // If no interviews, ensure status is set to default
            interviews.forEach(dto -> {
                if (dto.getStatus() == null) {
                    dto.setStatus("SCHEDULED");
                }
            });
        }
        
        return interviews;
    }

    public Interview completeInterview(Long interviewId, String completionNotes) {
        Interview interview = getInterviewById(interviewId);
        
        // If already completed (possibly by auto-completion), just return it
        if (interview.getStatus() == InterviewStatus.COMPLETED) {
            return interview;
        }
        
        if (interview.getStatus() == InterviewStatus.CANCELLED) {
            throw new RuntimeException("Cannot complete a cancelled interview");
        }
        
        // Check if current user has permission (same check as scheduling)
        // Admins and Secondary Admins can always complete interviews
        // Regular users can only complete if they assigned the job
        Optional<User> currentUserOpt = resolveCurrentUser();
        if (interview.getApplication() != null) {
            JobApplication application = interview.getApplication();
            if (currentUserOpt.isPresent()) {
                User currentUser = currentUserOpt.get();
                RoleStatus role = currentUser.getRole();
                
                // Admins and Secondary Admins can always complete interviews
                if (role != RoleStatus.ADMIN && role != RoleStatus.SECONDARY_ADMIN) {
                    // For non-admin users, check if they assigned the job
                    String currentUsername = currentUser.getUsername();
                    String assignedByUsername = application.getCreatedByName() != null ? application.getCreatedByName() : 
                        (application.getCreatedBy() != null ? application.getCreatedBy().getUsername() : null);
                    
                    if (assignedByUsername == null || !assignedByUsername.trim().equalsIgnoreCase(currentUsername.trim())) {
                        throw new RuntimeException("Only the user who assigned this job to the candidate can complete interviews.");
                    }
                }
            }
        }
        
        // Update interview status
        interview.setStatus(InterviewStatus.COMPLETED);
        interview.setCompletedAt(LocalDateTime.now());
        Interview savedInterview = interviewRepository.save(interview);
        
        // Automatically update application status to INTERVIEWED (only if not already updated)
        if (interview.getApplication() != null) {
            try {
                Long applicationId = interview.getApplication().getId();
                String statusDescription = completionNotes != null && !completionNotes.trim().isEmpty()
                    ? "Interview completed: " + completionNotes
                    : "Interview completed on " + interview.getInterviewDate();
                jobApplicationService.updateApplication(applicationId, ResultStatus.INTERVIEWED, statusDescription, null);
            } catch (Exception e) {
                // Log error but don't fail interview completion if status update fails
                System.err.println("Failed to update application status: " + e.getMessage());
            }
        }
        
        return savedInterview;
    }

    /**
     * Automatically complete interview if end time has passed and interview is still scheduled
     */
    private void autoCompleteIfPastDue(Interview interview) {
        if (interview == null || interview.getStatus() != InterviewStatus.SCHEDULED) {
            return;
        }
        
        if (interview.getInterviewDate() == null || interview.getEndTime() == null) {
            return;
        }
        
        // Check if end time has passed
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDateTime = LocalDateTime.of(interview.getInterviewDate(), interview.getEndTime());
        
        if (now.isAfter(endDateTime) || now.isEqual(endDateTime)) {
            // Automatically complete the interview
            try {
                interview.setStatus(InterviewStatus.COMPLETED);
                interview.setCompletedAt(now);
                interviewRepository.save(interview);
                
                // Update application status to INTERVIEWED
                if (interview.getApplication() != null) {
                    try {
                        Long applicationId = interview.getApplication().getId();
                        String statusDescription = "Interview completed automatically (end time passed) on " + interview.getInterviewDate();
                        jobApplicationService.updateApplication(applicationId, ResultStatus.INTERVIEWED, statusDescription, null);
                    } catch (Exception e) {
                        System.err.println("Failed to update application status for auto-completed interview: " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to auto-complete interview " + interview.getId() + ": " + e.getMessage());
            }
        }
    }

    public InterviewDetailDTO getInterviewDetails(Long id) {
        Interview interview = getInterviewById(id);
        InterviewDetailDTO dto = new InterviewDetailDTO();
        
        // Map interview basic info
        dto.setId(interview.getId());
        dto.setInterviewDate(interview.getInterviewDate());
        dto.setInterviewTime(interview.getInterviewTime());
        dto.setEndTime(interview.getEndTime());
        dto.setScheduledOn(interview.getScheduledOn());
        dto.setCompletedAt(interview.getCompletedAt());
        dto.setDescription(interview.getDescription());
        dto.setStatus(interview.getStatus() != null ? interview.getStatus().name() : null);
        
        // Map scheduling info
        dto.setScheduledByUserId(interview.getScheduledByUserId());
        dto.setScheduledByName(interview.getScheduledByName());
        dto.setScheduledByEmail(interview.getScheduledByEmail());
        
        // Map application info
        if (interview.getApplication() != null) {
            JobApplication application = interview.getApplication();
            dto.setApplicationId(application.getId());
            dto.setApplicationStatus(application.getStatus() != null ? application.getStatus().name() : null);
            
            if (application.getCandidate() != null) {
                dto.setCandidateId(application.getCandidate().getId());
                dto.setCandidateName(application.getCandidate().getName());
            } else {
                dto.setCandidateName(application.getCandidateName());
            }
            
            if (application.getJob() != null) {
                dto.setJobId(application.getJob().getId());
                dto.setJobTitle(application.getJob().getJobName());
                
                if (application.getJob().getClient() != null) {
                    dto.setClientId(application.getJob().getClient().getId());
                    dto.setClientName(application.getJob().getClient().getClientName());
                }
            }
            
            // Map status history
            List<StatusHistoryDTO> statusHistory = statusHistoryRepository
                .findByApplicationIdOrderByChangedAtDesc(application.getId())
                .stream()
                .map(history -> {
                    StatusHistoryDTO historyDTO = new StatusHistoryDTO();
                    historyDTO.setId(history.getId());
                    historyDTO.setStatus(history.getStatus() != null ? history.getStatus().name() : null);
                    historyDTO.setDescription(history.getDescription());
                    historyDTO.setChangedAt(history.getChangedAt());
                    if (history.getChangedBy() != null) {
                        historyDTO.setChangedByName(history.getChangedBy().getUsername());
                        historyDTO.setChangedByEmail(history.getChangedBy().getEmail());
                    } else {
                        historyDTO.setChangedByName(history.getChangedByName());
                        historyDTO.setChangedByEmail(history.getChangedByEmail());
                    }
                    return historyDTO;
                })
                .collect(Collectors.toList());
            dto.setStatusHistory(statusHistory);
        }
        
        return dto;
    }

    private Optional<User> resolveCurrentUser() {
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
    
    

}
