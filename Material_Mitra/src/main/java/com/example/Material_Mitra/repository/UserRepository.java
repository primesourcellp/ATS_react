package com.example.Material_Mitra.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.enums.RoleStatus;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);  // Find user by email

    boolean existsByRole(RoleStatus role);  // Check if any user has the given role
    
}
