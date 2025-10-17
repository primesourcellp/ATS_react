package com.example.Material_Mitra.repository;


import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.enums.ResultStatus;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    
    // Find all applications by status
    List<JobApplication> findByStatus(ResultStatus status);
    
    // Find all applications for a specific candidate
    List<JobApplication> findByCandidateId(Long candidateId);
    
    // Find all applications for a specific job
    List<JobApplication> findByJobId(Long jobId);
    
    // Find applications by candidate and status
    List<JobApplication> findByCandidateIdAndStatus(Long candidateId, ResultStatus status);
    
    // Find applications by job and status
    List<JobApplication> findByJobIdAndStatus(Long jobId, ResultStatus status);
    
    // Check if application exists for candidate and job
    boolean existsByCandidateIdAndJobId(Long candidateId, Long jobId);
    
    
    List<JobApplication> findByJob_JobNameIgnoreCase(String jobName);
   
    
    //search by candidate name
    @Query("SELECT ja FROM JobApplication ja WHERE LOWER(ja.candidate.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<JobApplication> findByCandidateNameContainingIgnoreCase(@Param("name") String name);


    @Query("SELECT ja.candidate FROM JobApplication ja WHERE ja.job.id = :jobId")
    List<Candidate> findCandidatesByJobId(@Param("jobId") Long jobId);
    
    
    List<JobApplication> findByStatusAndCandidate_NameContainingIgnoreCase(ResultStatus status, String name);



    List<JobApplication> findByJob_JobNameContainingIgnoreCase(String jobName);

    List<JobApplication> findByStatusAndCandidate_NameContainingIgnoreCaseAndJob_JobNameContainingIgnoreCase(
        ResultStatus status, String candidateName, String jobName
    );

//    Optional<JobApplication> findFirstByCandidateId(Long candidateId);
//    Optional<JobApplication> findByCandidateIdAndJobId(Long candidateId, Long jobId);
    @Query("SELECT ja FROM JobApplication ja " +
    	       "JOIN FETCH ja.candidate c " +
    	       "JOIN FETCH ja.job j " +
    	       "WHERE j.id = :jobId AND c.id = :candidateId")
    	Optional<JobApplication> findByJobIdAndCandidateId(@Param("jobId") Long jobId, @Param("candidateId") Long candidateId);
    JobApplication findFirstByCandidateId(Long candidateId);

    List<JobApplication> findAllByCandidateId(Long candidateId);

 // inside JobApplicationRepository interface
    JobApplication findByCandidateIdAndJobId(Long candidateId, Long jobId);
    
    long count();

    
}