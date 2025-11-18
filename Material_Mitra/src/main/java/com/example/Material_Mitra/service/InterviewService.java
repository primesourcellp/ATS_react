package com.example.Material_Mitra.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.Material_Mitra.dto.InterviewDTO;
import com.example.Material_Mitra.dto.InterviewListDTO;
import com.example.Material_Mitra.dto.InterviewPatchDTO;
import com.example.Material_Mitra.dto.InterviewUpdateDTO;
import com.example.Material_Mitra.entity.Interview;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.entity.User;
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

    public Interview getInterviewById(Long id) {
        return interviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Interview not found"));
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
        return interviewRepository.findByInterviewDate(date);
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
        return interviewRepository.searchInterviews(search, pageable);
    }


    public Interview scheduleInterview(Long applicationId, Interview interview) {
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Job Application not found with id: " + applicationId));

        // Check if current user is the one who assigned the job
        Optional<User> currentUserOpt = resolveCurrentUser();
        if (currentUserOpt.isPresent()) {
            User currentUser = currentUserOpt.get();
            String currentUsername = currentUser.getUsername();
            String assignedByUsername = application.getCreatedByName() != null ? application.getCreatedByName() : 
                (application.getCreatedBy() != null ? application.getCreatedBy().getUsername() : null);
            
            if (assignedByUsername == null || !assignedByUsername.trim().equalsIgnoreCase(currentUsername.trim())) {
                throw new RuntimeException("Only the user who assigned this job to the candidate can schedule interviews.");
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
        return interviewRepository.save(interview);
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
        return interviewRepository.findAllInterviewsWithClient();
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
