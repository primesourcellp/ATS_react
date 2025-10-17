package com.example.Material_Mitra.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.example.Material_Mitra.entity.PasswordResetOTP;

@Repository
public interface PasswordResetOTPRepository extends JpaRepository<PasswordResetOTP, Long> {
    
    // Find valid OTP by email and code
    @Query("SELECT o FROM PasswordResetOTP o WHERE o.email = :email AND o.otpCode = :otpCode AND o.used = false AND o.expiresAt > :now")
    Optional<PasswordResetOTP> findValidOTP(@Param("email") String email, @Param("otpCode") String otpCode, @Param("now") LocalDateTime now);
    
    // Find all OTPs for an email
    List<PasswordResetOTP> findByEmailOrderByCreatedAtDesc(String email);
    
    // Mark OTP as used
    @Modifying
    @Transactional
    @Query("UPDATE PasswordResetOTP o SET o.used = true WHERE o.id = :id")
    void markAsUsed(@Param("id") Long id);
    
    // Delete expired OTPs
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetOTP o WHERE o.expiresAt < :now")
    void deleteExpiredOTPs(@Param("now") LocalDateTime now);
    
    // Delete all OTPs for an email (cleanup)
    @Modifying
    @Transactional
    void deleteByEmail(String email);
}
