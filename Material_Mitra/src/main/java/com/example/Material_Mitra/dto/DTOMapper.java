package com.example.Material_Mitra.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.entity.JobApplication;

public class DTOMapper {
    
    // Static base URL for file URLs - set by configuration class
    private static String baseUrl = "http://localhost:8080";
    
    public static void setBaseUrl(String url) {
        baseUrl = url;
    }
    
    private static String getFileUrl(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }
        return baseUrl + "/api/files/" + filePath;
    }

//    public static JobDTO toJobDTO(Job job) {
//        if (job == null) return null;
//        JobDTO dto = new JobDTO();
//        dto.setId(job.getId());
//        dto.setJobName(job.getJobName());
//        dto.setJobLocation(job.getJobLocation());  // ✅ ADD THIS LINE
//
//        return dto;
//    }
			
	
	
	public static JobDTO toJobDTO(Job job) {
	    return toJobDTO(job, true);
	}
	
	// Overloaded method to control whether to include applications
	public static JobDTO toJobDTO(Job job, boolean includeApplications) {
	    if (job == null) return null;

	    JobDTO dto = new JobDTO();
	    dto.setId(job.getId());
	    dto.setJobName(job.getJobName());
	    dto.setJobLocation(job.getJobLocation());
	    dto.setSkillsName(job.getSkillsname()); // ✅ skills
	    dto.setJobDescription(job.getJobDiscription());
	    dto.setJobType(job.getJobType() != null ? job.getJobType().name() : null);
	    dto.setStatus(job.getStatus() != null ? job.getStatus().name() : null);
	    dto.setCreatedAt(job.getCreatedAt() != null ? job.getCreatedAt().toString() : null);
	    dto.setJobExperience(job.getJobExperience());
	    dto.setJobSalaryRange(job.getJobSalaryRange());
	    dto.setRolesAndResponsibilities(job.getRolesAndResponsibilities());

	    if (job.getClient() != null) {
	        ClientDTO clientDTO = new ClientDTO();
	        clientDTO.setId(job.getClient().getId());
	        clientDTO.setClientName(job.getClient().getClientName()); // ✅ correct getter
	        clientDTO.setAddress(job.getClient().getAddress());
	        clientDTO.setClientNumber(job.getClient().getClient_number());
	        dto.setClient(clientDTO);
	    }
	    
	    // Check if job has applications
	    boolean hasApplications = job.getApplications() != null && !job.getApplications().isEmpty();
	    dto.setHasApplications(hasApplications);
	    
	    // Map applications if they exist and includeApplications is true
	    if (includeApplications && job.getApplications() != null && !job.getApplications().isEmpty()) {
	        List<JobApplicationDTO> applicationDTOs = job.getApplications().stream()
	            .map(app -> {
	                // Create application DTO without job to prevent circular reference
	                JobApplicationDTO appDTO = new JobApplicationDTO();
	                appDTO.setId(app.getId());
	                appDTO.setCandidate(toCandidateDTO(app.getCandidate())); // Candidate is safe (doesn't include applications)
	                appDTO.setStatus(app.getStatus() != null ? app.getStatus().name() : null);
	                appDTO.setAppliedAt(app.getAppliedAt());
	                appDTO.setCandidateName(app.getCandidateName());
	                appDTO.setApplicationResumePath(app.getApplicationResumePath());
	                appDTO.setApplicationResumeUrl(getFileUrl(app.getApplicationResumePath()));
	                if (app.getCreatedBy() != null) {
	                    appDTO.setCreatedById(app.getCreatedBy().getId());
	                    appDTO.setCreatedByUsername(app.getCreatedBy().getUsername());
	                    appDTO.setCreatedByEmail(app.getCreatedBy().getEmail());
	                } else {
	                    appDTO.setCreatedById(app.getCreatedByUserId());
	                    appDTO.setCreatedByUsername(app.getCreatedByName());
	                    appDTO.setCreatedByEmail(app.getCreatedByEmail());
	                }
	                boolean hasCustomResume = app.getApplicationResumePath() != null && !app.getApplicationResumePath().isEmpty();
	                appDTO.setResumeAvailable(hasCustomResume);
	                boolean hasInterviews = app.getInterviews() != null && !app.getInterviews().isEmpty();
	                appDTO.setHasInterviews(hasInterviews);
	                
	                // Map status history
	                if (app.getStatusHistory() != null && !app.getStatusHistory().isEmpty()) {
	                    List<StatusHistoryDTO> historyDTOs = app.getStatusHistory().stream()
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
	                    appDTO.setStatusHistory(historyDTOs);
	                }
	                
	                // Map interviews
	                if (app.getInterviews() != null && !app.getInterviews().isEmpty()) {
	                    List<InterviewDTO> interviewDTOs = app.getInterviews().stream()
	                        .map(interview -> {
	                            InterviewDTO interviewDTO = new InterviewDTO();
	                            interviewDTO.setId(interview.getId());
	                            interviewDTO.setInterviewDate(interview.getInterviewDate());
	                            interviewDTO.setInterviewTime(interview.getInterviewTime());
	                            interviewDTO.setEndTime(interview.getEndTime());
	                            if (app.getCandidate() != null) {
	                                interviewDTO.setCandidateId(app.getCandidate().getId());
	                                interviewDTO.setCandidateName(app.getCandidate().getName());
	                            }
	                            if (app.getJob() != null) {
	                                interviewDTO.setJobTitle(app.getJob().getJobName());
	                                if (app.getJob().getClient() != null) {
	                                    interviewDTO.setClientName(app.getJob().getClient().getClientName());
	                                }
	                            }
	                            return interviewDTO;
	                        })
	                        .collect(Collectors.toList());
	                    appDTO.setInterviews(interviewDTOs);
	                }
	                
	                // Job is set to null to prevent circular reference
	                appDTO.setJob(null);
	                return appDTO;
	            })
	            .collect(Collectors.toList());
	        dto.setApplications(applicationDTOs);
	    }

	    return dto;
	}

	
	
    public static CandidateDTO toCandidateDTO(Candidate candidate) {
        if (candidate == null) return null;
        CandidateDTO dto = new CandidateDTO();
        dto.setId(candidate.getId());
        dto.setName(candidate.getName());
        dto.setEmail(candidate.getEmail());
        dto.setPhone(candidate.getPhone());
        dto.setSkills(candidate.getSkills());
        dto.setExperience(candidate.getExperience());
        dto.setNoticePeriod(candidate.getNoticePeriod());
        dto.setCurrentCtc(candidate.getCurrentCtc());
        dto.setExpectedCtc(candidate.getExpectedCtc());
        dto.setLocation(candidate.getLocation());
        dto.setUpdatedAt(candidate.getUpdatedAt());
        dto.setAbout(candidate.getAbout());
        dto.setResumePath(candidate.getResumePath());
        dto.setResumeUrl(getFileUrl(candidate.getResumePath()));
        dto.setHasResume(candidate.getResumePath() != null);
        dto.setCreatedAt(candidate.getCreatedAt());
        if (candidate.getCreatedBy() != null) {
            dto.setCreatedById(candidate.getCreatedBy().getId());
            dto.setCreatedByUsername(candidate.getCreatedBy().getUsername());
            dto.setCreatedByEmail(candidate.getCreatedBy().getEmail());
        } else {
            dto.setCreatedById(candidate.getCreatedByUserId());
            dto.setCreatedByUsername(candidate.getCreatedByName());
            dto.setCreatedByEmail(candidate.getCreatedByEmail());
        }
        
        // Check if candidate has applications
        boolean hasApplications = candidate.getApplications() != null && !candidate.getApplications().isEmpty();
        dto.setHasApplications(hasApplications);
        
        // Set job count
        int jobCount = candidate.getApplications() != null ? candidate.getApplications().size() : 0;
        dto.setJobCount(jobCount);
        
        // Set applied jobs list
        List<String> appliedJobs = new ArrayList<>();
        List<AppliedJobInfo> appliedJobsWithClient = new ArrayList<>();
        if (candidate.getApplications() != null && !candidate.getApplications().isEmpty()) {
            appliedJobs = candidate.getApplications().stream()
                .map(app -> app.getJob() != null ? app.getJob().getJobName() : "Unknown Job")
                .filter(jobName -> jobName != null && !jobName.isEmpty())
                .distinct() // Remove duplicates
                .collect(Collectors.toList());
                
            // Set applied jobs with client information
            appliedJobsWithClient = candidate.getApplications().stream()
                .map(app -> {
                    AppliedJobInfo info = new AppliedJobInfo();
                    info.setApplicationId(app.getId());
                    if (app.getJob() != null) {
                        info.setJobId(app.getJob().getId());
                        info.setJobName(app.getJob().getJobName());
                        if (app.getJob().getClient() != null) {
                            info.setClientName(app.getJob().getClient().getClientName());
                        } else {
                            info.setClientName("Unknown Client");
                        }
                    } else {
                        info.setJobName("Unknown Job");
                        info.setClientName("Unknown Client");
                    }

                    if (app.getCreatedBy() != null) {
                        info.setAssignedByUsername(app.getCreatedBy().getUsername());
                        info.setAssignedByEmail(app.getCreatedBy().getEmail());
                    } else {
                        info.setAssignedByUsername(app.getCreatedByName());
                        info.setAssignedByEmail(app.getCreatedByEmail());
                    }

                    return info;
                })
                .filter(jobInfo -> jobInfo.getJobName() != null && !jobInfo.getJobName().isEmpty())
                .collect(Collectors.toList());
        }
        dto.setAppliedJobs(appliedJobs);
        dto.setAppliedJobsWithClient(appliedJobsWithClient);

        dto.setStatus(candidate.getStatus() != null ? candidate.getStatus().name() : null);
        
        // Avoid mapping candidate.applications here to prevent recursion
        return dto;
    }

    public static JobApplicationDTO toJobApplicationDTO(JobApplication app) {
        if (app == null) return null;

        JobApplicationDTO dto = new JobApplicationDTO();
        dto.setId(app.getId());
        // Use toJobDTO with includeApplications=false to prevent circular reference
        dto.setJob(toJobDTO(app.getJob(), false));
        dto.setCandidate(toCandidateDTO(app.getCandidate()));
        dto.setStatus(app.getStatus() != null ? app.getStatus().name() : null);
        dto.setAppliedAt(app.getAppliedAt());
        dto.setCandidateName(app.getCandidateName());
        dto.setApplicationResumePath(app.getApplicationResumePath());
        dto.setApplicationResumeUrl(getFileUrl(app.getApplicationResumePath()));
        if (app.getCreatedBy() != null) {
            dto.setCreatedById(app.getCreatedBy().getId());
            dto.setCreatedByUsername(app.getCreatedBy().getUsername());
            dto.setCreatedByEmail(app.getCreatedBy().getEmail());
        } else {
            dto.setCreatedById(app.getCreatedByUserId());
            dto.setCreatedByUsername(app.getCreatedByName());
            dto.setCreatedByEmail(app.getCreatedByEmail());
        }
        
        // Resume is available only if a custom resume exists for this application
        boolean hasCustomResume = app.getApplicationResumePath() != null && !app.getApplicationResumePath().isEmpty();
        dto.setResumeAvailable(hasCustomResume);
        
        // Check if application has interviews
        boolean hasInterviews = app.getInterviews() != null && !app.getInterviews().isEmpty();
        dto.setHasInterviews(hasInterviews);
        
        // Map status history
        if (app.getStatusHistory() != null && !app.getStatusHistory().isEmpty()) {
            List<StatusHistoryDTO> historyDTOs = app.getStatusHistory().stream()
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
            dto.setStatusHistory(historyDTOs);
        }
        
        // Map interviews
        if (app.getInterviews() != null && !app.getInterviews().isEmpty()) {
            List<InterviewDTO> interviewDTOs = app.getInterviews().stream()
                .map(interview -> {
                    InterviewDTO interviewDTO = new InterviewDTO();
                    interviewDTO.setId(interview.getId());
                    interviewDTO.setInterviewDate(interview.getInterviewDate());
                    interviewDTO.setInterviewTime(interview.getInterviewTime());
                    interviewDTO.setEndTime(interview.getEndTime());
                    if (app.getCandidate() != null) {
                        interviewDTO.setCandidateId(app.getCandidate().getId());
                        interviewDTO.setCandidateName(app.getCandidate().getName());
                    }
                    if (app.getJob() != null) {
                        interviewDTO.setJobTitle(app.getJob().getJobName());
                        if (app.getJob().getClient() != null) {
                            interviewDTO.setClientName(app.getJob().getClient().getClientName());
                        }
                    }
                    return interviewDTO;
                })
                .collect(Collectors.toList());
            dto.setInterviews(interviewDTOs);
        }
        
        return dto;
    }

    public static CandidateDTO toCandidateDTOWithApplications(Candidate candidate) {
        if (candidate == null) return null;

        CandidateDTO dto = toCandidateDTO(candidate); // sets id, name, email, etc.

        List<JobApplicationDTO> applicationDTOs = candidate.getApplications().stream().map(app -> {
            JobApplicationDTO appDTO = new JobApplicationDTO();
            appDTO.setId(app.getId());

            // ✅ Include job details
            Job job = app.getJob();
            JobDTO jobDTO = new JobDTO();
            jobDTO.setId(job.getId());
            jobDTO.setJobName(job.getJobName());
            jobDTO.setJobLocation(job.getJobLocation());
            jobDTO.setSkillsName(job.getSkillsname()); // ✅ include skills

            // ✅ include client details
            if (job.getClient() != null) {
                ClientDTO clientDTO = new ClientDTO();
                clientDTO.setId(job.getClient().getId());
                clientDTO.setClientName(job.getClient().getClientName());
                clientDTO.setAddress(job.getClient().getAddress());
                clientDTO.setClientNumber(job.getClient().getClient_number());
                jobDTO.setClient(clientDTO);
            }
            appDTO.setJob(jobDTO);
            appDTO.setStatus(app.getStatus() != null ? app.getStatus().name() : null);
            appDTO.setAppliedAt(app.getAppliedAt());
            appDTO.setApplicationResumePath(app.getApplicationResumePath());
            appDTO.setResumeAvailable(app.getApplicationResumePath() != null && !app.getApplicationResumePath().isEmpty());
            if (app.getCreatedBy() != null) {
                appDTO.setCreatedById(app.getCreatedBy().getId());
                appDTO.setCreatedByUsername(app.getCreatedBy().getUsername());
                appDTO.setCreatedByEmail(app.getCreatedBy().getEmail());
            } else {
                appDTO.setCreatedById(app.getCreatedByUserId());
                appDTO.setCreatedByUsername(app.getCreatedByName());
                appDTO.setCreatedByEmail(app.getCreatedByEmail());
            }
            
            // Optional
            appDTO.setCandidateName(candidate.getName());
            
            // Map status history
            if (app.getStatusHistory() != null && !app.getStatusHistory().isEmpty()) {
                List<StatusHistoryDTO> historyDTOs = app.getStatusHistory().stream()
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
                appDTO.setStatusHistory(historyDTOs);
            }

            return appDTO;
        }).toList();

        dto.setApplications(applicationDTOs);
        return dto;
    }
    
   


}
