package com.example.Material_Mitra.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.Material_Mitra.dto.RecruiterApplicationSummaryDTO;
import com.example.Material_Mitra.dto.RecruiterCandidateSummaryDTO;
import com.example.Material_Mitra.dto.RecruiterInterviewSummaryDTO;
import com.example.Material_Mitra.dto.RecruiterReportDTO;
import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.entity.Interview;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.enums.RoleStatus;
import com.example.Material_Mitra.repository.CandidateRepository;
import com.example.Material_Mitra.repository.InterviewRepository;
import com.example.Material_Mitra.repository.JobApplicationRepository;
import com.example.Material_Mitra.repository.UserRepository;

@Service
public class ReportService {

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final InterviewRepository interviewRepository;

    public ReportService(UserRepository userRepository,
                         CandidateRepository candidateRepository,
                         JobApplicationRepository jobApplicationRepository,
                         InterviewRepository interviewRepository) {
        this.userRepository = userRepository;
        this.candidateRepository = candidateRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.interviewRepository = interviewRepository;
    }

    public DateRange resolveRange(String range, LocalDate startDate, LocalDate endDate) {
        LocalDate now = LocalDate.now();

        if (startDate != null && endDate != null && !startDate.isAfter(endDate)) {
            return new DateRange(startDate, endDate);
        }

        if (startDate != null && endDate == null) {
            return new DateRange(startDate, now);
        }

        if (startDate == null && endDate != null) {
            return new DateRange(endDate, endDate);
        }

        String normalized = Optional.ofNullable(range)
                .map(String::trim)
                .map(String::toLowerCase)
                .orElse("today");

        switch (normalized) {
            case "week":
                LocalDate weekStart = now.with(DayOfWeek.MONDAY);
                return new DateRange(weekStart, now);
            case "month":
                LocalDate monthStart = now.withDayOfMonth(1);
                return new DateRange(monthStart, now);
            default:
                return new DateRange(now, now);
        }
    }

    public List<RecruiterReportDTO> getReportsForAllRecruiters(LocalDate startDate, LocalDate endDate) {
        return userRepository.findByRole(RoleStatus.RECRUITER).stream()
                .sorted(Comparator.comparing(User::getUsername, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(user -> buildReportForRecruiter(user, startDate, endDate))
                .collect(Collectors.toList());
    }

    public RecruiterReportDTO getReportForRecruiter(User recruiter, LocalDate startDate, LocalDate endDate) {
        return buildReportForRecruiter(recruiter, startDate, endDate);
    }

    public Optional<User> findRecruiterByUsername(String username) {
        return userRepository.findByUsername(username)
                .filter(user -> user.getRole() == RoleStatus.RECRUITER
                        || user.getRole() == RoleStatus.SECONDARY_ADMIN
                        || user.getRole() == RoleStatus.ADMIN);
    }

    public Optional<User> findRecruiterById(Long id) {
        return userRepository.findById(id)
                .filter(user -> user.getRole() == RoleStatus.RECRUITER
                        || user.getRole() == RoleStatus.SECONDARY_ADMIN
                        || user.getRole() == RoleStatus.ADMIN);
    }

    private RecruiterReportDTO buildReportForRecruiter(User recruiter, LocalDate startDate, LocalDate endDate) {
        LocalDateTime rangeStart = startDate.atStartOfDay();
        LocalDateTime rangeEnd = endDate.atTime(LocalTime.MAX);

        List<Candidate> candidates = candidateRepository.findByCreatedBy_IdAndCreatedAtBetween(
                recruiter.getId(), rangeStart, rangeEnd);

        List<JobApplication> applications = jobApplicationRepository.findDetailedByCreatedByAndAppliedAtBetween(
                recruiter.getId(), startDate, endDate);

        List<Interview> interviews = interviewRepository.findDetailedByScheduledByAndScheduledOnBetween(
                recruiter.getId(), startDate, endDate);

        List<RecruiterCandidateSummaryDTO> candidateSummaries = candidates.stream()
                .sorted(Comparator.comparing(Candidate::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(candidate -> new RecruiterCandidateSummaryDTO(
                        candidate.getId(),
                        candidate.getName(),
                        candidate.getStatus() != null ? candidate.getStatus().name() : null,
                        candidate.getCreatedAt()))
                .collect(Collectors.toList());

        List<RecruiterApplicationSummaryDTO> applicationSummaries = applications.stream()
                .sorted(Comparator.comparing(JobApplication::getAppliedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(application -> new RecruiterApplicationSummaryDTO(
                        application.getId(),
                        application.getCandidate() != null ? application.getCandidate().getName() : application.getCandidateName(),
                        application.getJob() != null ? application.getJob().getJobName() : null,
                        application.getStatus() != null ? application.getStatus().name() : null,
                        application.getAppliedAt()))
                .collect(Collectors.toList());

        List<RecruiterInterviewSummaryDTO> interviewSummaries = interviews.stream()
                .sorted(Comparator.comparing(Interview::getScheduledOn, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(interview -> new RecruiterInterviewSummaryDTO(
                        interview.getId(),
                        interview.getApplication() != null && interview.getApplication().getCandidate() != null
                                ? interview.getApplication().getCandidate().getName() : null,
                        interview.getApplication() != null && interview.getApplication().getJob() != null
                                ? interview.getApplication().getJob().getJobName() : null,
                        interview.getInterviewDate(),
                        interview.getInterviewTime(),
                        interview.getEndTime(),
                        interview.getScheduledOn()))
                .collect(Collectors.toList());

        RecruiterReportDTO dto = new RecruiterReportDTO();
        dto.setRecruiterId(recruiter.getId());
        dto.setRecruiterUsername(recruiter.getUsername());
        dto.setRecruiterEmail(recruiter.getEmail());
        dto.setStartDate(startDate);
        dto.setEndDate(endDate);
        dto.setCandidates(candidateSummaries);
        dto.setApplications(applicationSummaries);
        dto.setInterviews(interviewSummaries);
        dto.setCandidateCount(candidateSummaries.size());
        dto.setApplicationCount(applicationSummaries.size());
        dto.setInterviewCount(interviewSummaries.size());

        return dto;
    }

    public static class DateRange {
        private final LocalDate startDate;
        private final LocalDate endDate;

        public DateRange(LocalDate startDate, LocalDate endDate) {
            this.startDate = startDate;
            this.endDate = endDate;
        }

        public LocalDate getStartDate() {
            return startDate;
        }

        public LocalDate getEndDate() {
            return endDate;
        }
    }
}

