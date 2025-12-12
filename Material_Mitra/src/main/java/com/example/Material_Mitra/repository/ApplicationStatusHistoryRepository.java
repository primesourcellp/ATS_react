package com.example.Material_Mitra.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Material_Mitra.entity.ApplicationStatusHistory;
import com.example.Material_Mitra.entity.JobApplication;

@Repository
public interface ApplicationStatusHistoryRepository extends JpaRepository<ApplicationStatusHistory, Long> {
    List<ApplicationStatusHistory> findByApplicationOrderByChangedAtDesc(JobApplication application);
    List<ApplicationStatusHistory> findByApplicationIdOrderByChangedAtDesc(Long applicationId);
    List<ApplicationStatusHistory> findByChangedBy_Id(Long userId);
}

