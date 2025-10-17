package com.example.Material_Mitra.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Material_Mitra.entity.Client;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
	
	@Query("SELECT DISTINCT c FROM Client c " +
		       "LEFT JOIN c.jobs j " +
		       "WHERE LOWER(c.clientName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
		       "   OR LOWER(c.address) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
		       "   OR LOWER(c.client_number) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
		       "   OR LOWER(j.jobName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
		List<Client> searchClientsByKeyword(@Param("keyword") String keyword);


}



