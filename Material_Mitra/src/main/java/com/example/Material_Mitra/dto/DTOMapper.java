package com.example.Material_Mitra.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.entity.JobApplication;

public class DTOMapper {

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
        dto.setResumeUrl(candidate.getResumePath() != null ? "http://localhost:8080/api/files/" + candidate.getResumePath() : null);
        dto.setHasResume(candidate.getResumePath() != null);
        
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
                    String jobName = app.getJob() != null ? app.getJob().getJobName() : "Unknown Job";
                    String clientName = app.getJob() != null && app.getJob().getClient() != null ? 
                        app.getJob().getClient().getClientName() : "Unknown Client";
                    return new AppliedJobInfo(jobName, clientName);
                })
                .filter(jobInfo -> jobInfo.getJobName() != null && !jobInfo.getJobName().isEmpty())
                .distinct() // Remove duplicates based on job name
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
        dto.setJob(toJobDTO(app.getJob()));
        dto.setCandidate(toCandidateDTO(app.getCandidate()));
        dto.setStatus(app.getStatus() != null ? app.getStatus().name() : null);
        dto.setAppliedAt(app.getAppliedAt());
        dto.setCandidateName(app.getCandidateName());
        dto.setApplicationResumePath(app.getApplicationResumePath());
        dto.setApplicationResumeUrl(app.getApplicationResumePath() != null ? "http://localhost:8080/api/files/" + app.getApplicationResumePath() : null);
        
        // Resume is available if either custom resume exists OR candidate has master resume
        boolean hasCustomResume = app.getApplicationResumePath() != null && !app.getApplicationResumePath().isEmpty();
        boolean hasMasterResume = app.getCandidate() != null && app.getCandidate().getResumePath() != null && !app.getCandidate().getResumePath().isEmpty();
        dto.setResumeAvailable(hasCustomResume || hasMasterResume);
        
        // Check if application has interviews
        boolean hasInterviews = app.getInterviews() != null && !app.getInterviews().isEmpty();
        dto.setHasInterviews(hasInterviews);
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
//            appDTO.setResumePath(app.getResumePath());
            
            // Optional
            appDTO.setCandidateName(candidate.getName());

            return appDTO;
        }).toList();

        dto.setApplications(applicationDTOs);
        return dto;
    }
    
   


}
