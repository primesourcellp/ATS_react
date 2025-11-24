package com.example.Material_Mitra.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.Material_Mitra.entity.Job;
import com.example.Material_Mitra.enums.JobStatus;


public interface JobRepository extends JpaRepository<Job, Long> {
	
	  List<Job> findByJobNameContainingIgnoreCase(String jobName);
	  List<Job> findByJobLocationContainingIgnoreCase(String location);
	  List<Job> findByCreatedAt(LocalDate date);
	// JobRepository.java
	  List<Job> findBySkillsnameContainingIgnoreCase(String skillKeyword);
	  long count();

	  List<Job> findByStatus(JobStatus status);

	  @Query("SELECT DISTINCT j FROM Job j JOIN j.client c JOIN c.permissions p " +
	         "WHERE p.recruiter.id = :recruiterId AND p.canViewJobs = true")
	  List<Job> findByAssignedRecruiter(@Param("recruiterId") Long recruiterId);

}