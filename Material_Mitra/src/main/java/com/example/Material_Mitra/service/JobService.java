package com.example.Material_Mitra.service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.Material_Mitra.dto.ClientDTO;
import com.example.Material_Mitra.dto.JobDTO;
import com.example.Material_Mitra.entity.Client;
import com.example.Material_Mitra.entity.Interview;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.enums.JobStatus;
import com.example.Material_Mitra.repository.ClientRepository;
import com.example.Material_Mitra.repository.InterviewRepository;
import com.example.Material_Mitra.repository.JobApplicationRepository;
import com.example.Material_Mitra.repository.JobRepository;

import jakarta.transaction.Transactional;


@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;
    @Autowired
    private JobApplicationRepository applicationRepository;
    @Autowired
    private InterviewRepository interviewRepository; 
    
    @Autowired
    private ClientRepository clientRepository;


//    public Job addJob(Job job, Long clientId) {
//        if (job.getSkillsname() == null || job.getSkillsname().isBlank()) {
//            job.setSkillsname("No skills specified");
//        }
//
//        // 🔹 Always start with NOT_SELECTED at creation
//        job.setStatus(JobStatus.NOT_SELECTED);
//
//        // Set client
//        Client client = clientRepository.findById(clientId)
//            .orElseThrow(() -> new RuntimeException("Client not found"));
//        job.setClient(client);
//
//        return jobRepository.save(job);
//    }

    public Job addJob(Job job, Long clientId) {

        // Optional: handle empty skills
        if (job.getSkillsname() == null || job.getSkillsname().isBlank()) {
            job.setSkillsname("No skills specified");
        }

        // 🔹 Do NOT overwrite status here
        // job.setStatus(JobStatus.NOT_SELECTED); <-- remove this line

        // Set client
        Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new RuntimeException("Client not found"));
        job.setClient(client);

        return jobRepository.save(job);
    }


    public Job updateJob(Long id, Job jobDetails) {
        Job job = jobRepository.findById(id).orElseThrow();
        job.setJobName(jobDetails.getJobName());
        job.setJobLocation(jobDetails.getJobLocation());
        job.setSkillsname(jobDetails.getSkillsname());
        job.setJobDiscription(jobDetails.getJobDiscription());
        job.setRolesAndResponsibilities(jobDetails.getRolesAndResponsibilities());
        job.setJobSalaryRange(jobDetails.getJobSalaryRange());
        job.setJobExperience(jobDetails.getJobExperience());
        return jobRepository.save(job);
    }


    @Transactional
    public void deleteJob(Long id) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found with id: " + id));

        // Check linked job applications
        List<JobApplication> applications = applicationRepository.findByJobId(id);
        if (!applications.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cannot delete job: it has existing candidates linked through applications."
            );
        }

        // Check linked interviews
        List<Interview> interviews = interviewRepository.findByJobId(id);
        if (!interviews.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cannot delete job: it is linked to existing interviews."
            );
        }

        jobRepository.delete(job);
    }



    public Job getJobById(Long id) {
        return jobRepository.findById(id).orElseThrow();
    }

    public List<Job> searchJobsByName(String jobName) {
        return jobRepository.findByJobNameContainingIgnoreCase(jobName);
    }

    public List<Job> getJobsByLocation(String location) {
        return jobRepository.findByJobLocationContainingIgnoreCase(location);
    }

    public List<Job> getJobsByDate(LocalDate date) {
        return jobRepository.findByCreatedAt(date);
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }
 // JobService.java
    public List<Job> searchJobsBySkill(String skillKeyword) {
        return jobRepository.findBySkillsnameContainingIgnoreCase(skillKeyword);
    }

    public long getJobCount() {
        return jobRepository.count();
    }
    

 // In JobService.java
    public JobDTO getJobDTOById(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        return convertToDTO(job);
    }

    public List<JobDTO> getAllJobDTOs() {
        return jobRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

 // In JobService.java
    public JobDTO convertToDTO(Job job) {
        JobDTO dto = new JobDTO();
        dto.setId(job.getId());
        dto.setJobName(job.getJobName());
        dto.setJobLocation(job.getJobLocation());
        dto.setCreatedAt(job.getCreatedAt().toString());
        dto.setSkillsName(job.getSkillsname());
        dto.setJobDescription(job.getJobDiscription());
        dto.setJobExperience(job.getJobExperience());
        dto.setJobSalaryRange(job.getJobSalaryRange());
        dto.setRolesAndResponsibilities(job.getRolesAndResponsibilities());
        
        // ✅ Convert enum to String for DTO
        if (job.getJobType() != null) {
            dto.setJobType(job.getJobType().name()); // <-- Use .name() here
        }

        dto.setStatus(job.getStatus().name());

        if (job.getClient() != null) {
            ClientDTO clientDTO = new ClientDTO();
            clientDTO.setId(job.getClient().getId());
            clientDTO.setClientName(job.getClient().getClientName());
            clientDTO.setAddress(job.getClient().getAddress());
            clientDTO.setClientNumber(job.getClient().getClient_number());
            dto.setClient(clientDTO);
        }

        return dto;
    }

    // Lightweight mapper without client details (for public/active listing)
    public JobDTO convertToDTOWithoutClient(Job job) {
        JobDTO dto = new JobDTO();
        dto.setId(job.getId());
        dto.setJobName(job.getJobName());
        dto.setJobLocation(job.getJobLocation());
        dto.setCreatedAt(job.getCreatedAt().toString());
        dto.setSkillsName(job.getSkillsname());
        dto.setJobDescription(job.getJobDiscription());
        dto.setJobExperience(job.getJobExperience());
        dto.setJobSalaryRange(job.getJobSalaryRange());
        dto.setRolesAndResponsibilities(job.getRolesAndResponsibilities());
        if (job.getJobType() != null) {
            dto.setJobType(job.getJobType().name());
        }
        dto.setStatus(job.getStatus().name());
        // intentionally do NOT set client
        return dto;
    }


    
    public JobDTO updateJobStatus(Long jobId, JobStatus newStatus) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        job.setStatus(newStatus);
        jobRepository.save(job);

        return convertToDTO(job); // you already have convertToDTO
    }

    
    
//    for website status

   
    public List<JobDTO> getActiveJobs() {
        return jobRepository.findByStatus(JobStatus.ACTIVE)
                            .stream()
                            .map(this::convertToDTOWithoutClient)
                            .collect(Collectors.toList());
    }

   
    }
