package com.example.Material_Mitra.repository;

import java.time.LocalDate;
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

    List<JobApplication> findByStatus(ResultStatus status);

    List<JobApplication> findByCandidateId(Long candidateId);

    List<JobApplication> findByJobId(Long jobId);

    List<JobApplication> findByCandidateIdAndStatus(Long candidateId, ResultStatus status);

    List<JobApplication> findByJobIdAndStatus(Long jobId, ResultStatus status);

    boolean existsByCandidateIdAndJobId(Long candidateId, Long jobId);

    List<JobApplication> findByJob_JobNameIgnoreCase(String jobName);

    @Query("SELECT ja FROM JobApplication ja WHERE LOWER(ja.candidate.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<JobApplication> findByCandidateNameContainingIgnoreCase(@Param("name") String name);

    @Query("SELECT ja.candidate FROM JobApplication ja WHERE ja.job.id = :jobId")
    List<Candidate> findCandidatesByJobId(@Param("jobId") Long jobId);

    List<JobApplication> findByStatusAndCandidate_NameContainingIgnoreCase(ResultStatus status, String name);

    List<JobApplication> findByJob_JobNameContainingIgnoreCase(String jobName);

    List<JobApplication> findByStatusAndCandidate_NameContainingIgnoreCaseAndJob_JobNameContainingIgnoreCase(
        ResultStatus status, String candidateName, String jobName);

    @Query("SELECT ja FROM JobApplication ja " +
           "JOIN FETCH ja.candidate c " +
           "JOIN FETCH ja.job j " +
           "WHERE j.id = :jobId AND c.id = :candidateId")
    Optional<JobApplication> findByJobIdAndCandidateId(@Param("jobId") Long jobId, @Param("candidateId") Long candidateId);

    JobApplication findFirstByCandidateId(Long candidateId);

    List<JobApplication> findAllByCandidateId(Long candidateId);

    JobApplication findByCandidateIdAndJobId(Long candidateId, Long jobId);

    @Override
    long count();

    List<JobApplication> findByCreatedBy_IdAndAppliedAtBetween(Long recruiterId, LocalDate startDate, LocalDate endDate);

    List<JobApplication> findByCreatedBy_Id(Long recruiterId);

    long countByCreatedBy_IdAndAppliedAtBetween(Long recruiterId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT ja FROM JobApplication ja " +
           "JOIN FETCH ja.candidate c " +
           "JOIN FETCH ja.job j " +
           "LEFT JOIN FETCH j.client cl " +
           "WHERE ja.createdBy.id = :recruiterId AND ja.appliedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY ja.appliedAt DESC, ja.id DESC")
    List<JobApplication> findDetailedByCreatedByAndAppliedAtBetween(@Param("recruiterId") Long recruiterId,
                                                                    @Param("startDate") LocalDate startDate,
                                                                    @Param("endDate") LocalDate endDate);

    @Query("SELECT DISTINCT c FROM JobApplication ja " +
           "JOIN ja.candidate c " +
           "JOIN ja.job j " +
           "JOIN j.client cl " +
           "JOIN cl.permissions p " +
           "WHERE p.recruiter.id = :recruiterId AND p.canViewCandidates = true")
    List<Candidate> findCandidatesByAssignedRecruiter(@Param("recruiterId") Long recruiterId);

    @Query("SELECT ja FROM JobApplication ja " +
           "JOIN ja.job j " +
           "JOIN j.client cl " +
           "JOIN cl.permissions p " +
           "WHERE p.recruiter.id = :recruiterId AND p.canViewCandidates = true")
    List<JobApplication> findApplicationsByAssignedRecruiter(@Param("recruiterId") Long recruiterId);
}
