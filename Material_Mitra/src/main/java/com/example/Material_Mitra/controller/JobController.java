// JobController.java
package com.example.Material_Mitra.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.Material_Mitra.dto.DTOMapper;
import com.example.Material_Mitra.dto.JobDTO;
import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.enums.JobStatus;
import com.example.Material_Mitra.service.JobService;


@RestController
@RequestMapping("/jobs")
public class JobController {

    @Autowired
    private JobService jobService;

//
//    @PostMapping("/add")
//    public ResponseEntity<Job> createJob(@RequestBody Job job, @RequestParam Long clientId) {
//        job.setCreatedAt(LocalDate.now());
//        Job createdJob = jobService.addJob(job, clientId);
//        return ResponseEntity.ok(createdJob);
//    }
    @PostMapping("/add")
    public ResponseEntity<Job> createJob(@RequestBody Job job, @RequestParam Long clientId) {
        job.setCreatedAt(LocalDate.now());

        // JobType must be provided by frontend, no default
        if (job.getJobType() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job type must be selected");
        }

        Job createdJob = jobService.addJob(job, clientId);
        return ResponseEntity.ok(createdJob);
    }


//    @PreAuthorize("hasRole('ADMIN')")
//    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Job updateJob(@PathVariable Long id, @RequestBody Job job) {
        return jobService.updateJob(id, job);
    }

//    @PreAuthorize("hasRole('ADMIN')")
//    @PreAuthorize("hasRole('ADMIN')")
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable Long id) {
        try {
            jobService.deleteJob(id);

            // Return JSON response
            return ResponseEntity.ok(Map.of("message", "Job deleted successfully"));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("error", e.getReason()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "An unexpected error occurred"));
        }
    }


    @GetMapping("/{id}")
    public ResponseEntity<JobDTO> getJob(@PathVariable Long id) {
        Job job = jobService.getJobById(id);
        if (job == null) {
            return ResponseEntity.notFound().build();
        }
        JobDTO jobDTO = DTOMapper.toJobDTO(job);
        return ResponseEntity.ok(jobDTO);
    }
    
    //name by fetch
    @GetMapping("/search/{name}")
    public ResponseEntity<List<Job>> searchJobs(@PathVariable String name) {
        List<Job> jobs = jobService.searchJobsByName(name);
        return ResponseEntity.ok(jobs);
    }
    
    @GetMapping("/location/{location}")
    public ResponseEntity<List<Job>> getJobsByLocation(@PathVariable String location) {
        List<Job> jobs = jobService.getJobsByLocation(location);
        return ResponseEntity.ok(jobs);
    }
    @GetMapping("/date")
    public ResponseEntity<List<Job>> getJobsByDate(@RequestParam("createdAt") String createdAt) {
        LocalDate date = LocalDate.parse(createdAt); // Format must be YYYY-MM-DD
        List<Job> jobs = jobService.getJobsByDate(date);
        return ResponseEntity.ok(jobs);
    }

//    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<JobDTO>> getAllJobs() {
        List<Job> jobs = jobService.getAllJobs();
        List<JobDTO> jobDTOs = jobs.stream()
            .map(DTOMapper::toJobDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(jobDTOs);
    }
 // JobController.java
  
    @GetMapping("/search/skill/{keyword}")
    public ResponseEntity<List<JobDTO>> searchJobsBySkill(@PathVariable String keyword) {
        List<Job> jobs = jobService.searchJobsBySkill(keyword);
        List<JobDTO> jobDTOs = jobs.stream()
            .map(DTOMapper::toJobDTO)
            .collect(Collectors.toList());
        return ResponseEntity.ok(jobDTOs);
    }

//    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/counts")
    public long getJobCount() {
        return jobService.getJobCount();
    }
//******
    
 // In JobController.java or CandidateController.java

//  web site fetch
    
    @PutMapping("/{id}/status")
    public ResponseEntity<JobDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam JobStatus status) {
        JobDTO updatedJob = jobService.updateJobStatus(id, status);
        return ResponseEntity.ok(updatedJob);
    }
    
//    
//    @GetMapping("/active")
//    public ResponseEntity<List<JobDTO>> getActiveJobs() {
//        return ResponseEntity.ok(jobService.getActiveJobs());
//    }
    @GetMapping("/active")
    public ResponseEntity<List<JobDTO>> getActiveJobs() {
        List<JobDTO> activeJobs = jobService.getActiveJobs(); // make sure this fetches only active
        return ResponseEntity.ok(activeJobs);
    }


}
