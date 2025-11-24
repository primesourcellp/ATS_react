package com.example.Material_Mitra.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Material_Mitra.entity.ClientRecruiterPermission;

@Repository
public interface ClientRecruiterPermissionRepository extends JpaRepository<ClientRecruiterPermission, Long> {

    List<ClientRecruiterPermission> findByClient_Id(Long clientId);

    List<ClientRecruiterPermission> findByRecruiter_Id(Long recruiterId);

    Optional<ClientRecruiterPermission> findByClient_IdAndRecruiter_Id(Long clientId, Long recruiterId);
}


