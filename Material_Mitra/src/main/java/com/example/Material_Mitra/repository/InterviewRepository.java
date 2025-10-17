package com.example.Material_Mitra.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.example.Material_Mitra.dto.InterviewDTO;
import com.example.Material_Mitra.dto.InterviewListDTO;
import com.example.Material_Mitra.entity.Interview;

public interface InterviewRepository extends JpaRepository<Interview, Long> {

    
    List<Interview> findByInterviewDate(LocalDate date);
    long countByInterviewDate(LocalDate date);
    
    
    @Query("SELECT new com.example.Material_Mitra.dto.InterviewListDTO(" +
    	       "i.id, c.name, j.jobName, i.interviewDate, i.interviewTime, i.endTime) " +
    	       "FROM Interview i " +
    	       "JOIN i.application a " +
    	       "JOIN a.candidate c " +
    	       "JOIN a.job j " +
    	       "WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
    	       "OR LOWER(j.jobName) LIKE LOWER(CONCAT('%', :search, '%'))")
    	Page<InterviewListDTO> searchInterviews(@Param("search") String search, Pageable pageable);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Interview i WHERE i.application.id IN :appIds")
    void deleteByApplicationIds(@Param("appIds") List<Long> appIds);


    
//    List<Interview> findByJobId(Long jobId);
    
    @Query("SELECT i FROM Interview i WHERE i.application.job.id = :jobId")
    List<Interview> findByJobId(@Param("jobId") Long jobId);
    
    
    @Query("""
    	    SELECT new com.example.Material_Mitra.dto.InterviewDTO(
    	        i.id,
    	        c.name,
    	        j.jobName,
    	        COALESCE(cl.clientName, ''),
    	        i.interviewDate,
    	        i.interviewTime,
    	        i.endTime
    	    )
    	    FROM Interview i
    	    JOIN i.application a
    	    JOIN a.candidate c
    	    JOIN a.job j
    	    LEFT JOIN j.client cl
    	    ORDER BY i.interviewDate DESC, i.interviewTime ASC
    	""")
    	List<InterviewDTO> findAllInterviewsWithClient();

}
