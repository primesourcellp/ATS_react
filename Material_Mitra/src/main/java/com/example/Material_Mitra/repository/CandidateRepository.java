package com.example.Material_Mitra.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.enums.ResultStatus;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    List<Candidate> findByStatus(ResultStatus status);

    List<Candidate> findByEmail(String email);

    Optional<Candidate> findByPhone(String phone);

    List<Candidate> findByNameContainingIgnoreCase(String name);

    @Override
    long count();

    List<Candidate> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContaining(
        String name, String email, String phone);

    @Query("SELECT DISTINCT c FROM Candidate c LEFT JOIN FETCH c.applications a LEFT JOIN FETCH a.job")
    List<Candidate> findAllWithApplications();

    @Query("SELECT DISTINCT c FROM Candidate c " +
           "LEFT JOIN c.applications a " +
           "LEFT JOIN a.job j " +
           "WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "   OR LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "   OR LOWER(c.phone) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "   OR LOWER(c.skills) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "   OR LOWER(j.jobName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Candidate> searchCandidatesByKeyword(@Param("keyword") String keyword);

    @Query("SELECT c FROM Candidate c LEFT JOIN FETCH c.applications a LEFT JOIN FETCH a.job WHERE c.id = :id")
    Optional<Candidate> findByIdWithApplicationsAndJobs(@Param("id") Long id);

    @Query("SELECT DISTINCT c FROM Candidate c " +
           "LEFT JOIN FETCH c.applications a " +
           "LEFT JOIN FETCH a.job j " +
           "LEFT JOIN FETCH j.client " +
           "WHERE c.id = :id")
    Optional<Candidate> findByIdWithApplicationsAndJobAndClient(@Param("id") Long id);

    List<Candidate> findByCreatedBy_IdAndCreatedAtBetween(Long createdById, LocalDateTime startDate, LocalDateTime endDate);

    List<Candidate> findByCreatedBy_Id(Long createdById);

    long countByCreatedBy_IdAndCreatedAtBetween(Long createdById, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Fast search candidates by keywords in resume text (database-level search)
     * Uses LIKE queries on stored resume_text column for much faster performance
     */
    @Query("SELECT c FROM Candidate c WHERE c.resumeText IS NOT NULL AND c.resumeText != '' " +
           "AND LOWER(c.resumeText) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Candidate> findByResumeTextContaining(@Param("keyword") String keyword);
    
    /**
     * Count candidates matching keywords in resume text (database-level search)
     */
    @Query("SELECT COUNT(c) FROM Candidate c WHERE c.resumeText IS NOT NULL AND c.resumeText != '' " +
           "AND LOWER(c.resumeText) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    long countByResumeTextContaining(@Param("keyword") String keyword);
    
    /**
     * Fast search with multiple keywords - all keywords must be present
     * This uses native SQL for better performance with multiple LIKE conditions
     */
    @Query(value = "SELECT * FROM candidate c WHERE c.resume_text IS NOT NULL AND c.resume_text != '' " +
           "AND LOWER(c.resume_text) LIKE LOWER(CONCAT('%', :keyword1, '%')) " +
           "AND LOWER(c.resume_text) LIKE LOWER(CONCAT('%', :keyword2, '%'))", nativeQuery = true)
    List<Candidate> findByResumeTextContainingBothKeywords(@Param("keyword1") String keyword1, @Param("keyword2") String keyword2);
}
