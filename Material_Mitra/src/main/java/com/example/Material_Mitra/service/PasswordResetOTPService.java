package com.example.Material_Mitra.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Material_Mitra.entity.PasswordResetOTP;
import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.repository.PasswordResetOTPRepository;
import com.example.Material_Mitra.repository.UserRepository;

@Service
@Transactional
public class PasswordResetOTPService {
    
    @Autowired
    private PasswordResetOTPRepository otpRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    private static final int OTP_LENGTH = 6;
    private static final int OTP_VALIDITY_MINUTES = 10;
    
    /**
     * Generate and send OTP for password reset
     */
    public boolean generateAndSendOTP(String email) {
        try {
            System.out.println("🔍 Looking for user with email: " + email);
            
            // Check if user exists with this email
            List<User> users = userRepository.findByEmail(email);
            if (users.isEmpty()) {
                System.out.println("❌ No user found with email: " + email);
                return false; // Return false if email doesn't exist
            }
            
            if (users.size() > 1) {
                System.out.println("⚠️ Multiple users found with email: " + email + " (count: " + users.size() + ")");
                // Use the first user (usually the admin)
            }
            
            User user = users.get(0);
            System.out.println("✅ User found: " + user.getUsername() + " (ID: " + user.getId() + ")");
            
            // Clean up old OTPs for this email
            cleanupOldOTPs(email);
            
            // Generate new OTP
            String otpCode = generateOTP();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES);
            
            // Save OTP to database
            PasswordResetOTP otp = new PasswordResetOTP(email, otpCode, expiresAt);
            otpRepository.save(otp);
            
            // Send OTP via email
            emailService.sendOTPEmail(email, otpCode);
            
            // Also log OTP to console for debugging (REMOVE IN PRODUCTION)
            System.out.println("🔑 OTP FOR " + email + ": " + otpCode);
            System.out.println("📧 If email not received, check spam folder or use this OTP: " + otpCode);
            
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Verify OTP and reset password
     */
    public boolean verifyOTPAndResetPassword(String email, String otpCode, String newPassword) {
        try {
            // Find valid OTP
            Optional<PasswordResetOTP> otpOpt = otpRepository.findValidOTP(email, otpCode, LocalDateTime.now());
            if (otpOpt.isEmpty()) {
                return false; // Invalid or expired OTP
            }
            
            PasswordResetOTP otp = otpOpt.get();
            
            // Find user
            List<User> users = userRepository.findByEmail(email);
            if (users.isEmpty()) {
                return false; // User not found
            }
            
            User user = users.get(0); // Use the first user
            
            // Update password
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            
            // Mark OTP as used
            otp.setUsed(true);
            otpRepository.save(otp);
            
            // Clean up old OTPs for this email
            cleanupOldOTPs(email);
            
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Verify OTP without resetting password (for validation)
     */
    public boolean verifyOTP(String email, String otpCode) {
        try {
            Optional<PasswordResetOTP> otpOpt = otpRepository.findValidOTP(email, otpCode, LocalDateTime.now());
            return otpOpt.isPresent();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * Generate random OTP code
     */
    private String generateOTP() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        
        return otp.toString();
    }
    
    /**
     * Clean up old OTPs for an email
     */
    private void cleanupOldOTPs(String email) {
        try {
            List<PasswordResetOTP> oldOTPs = otpRepository.findByEmailOrderByCreatedAtDesc(email);
            for (PasswordResetOTP oldOTP : oldOTPs) {
                if (oldOTP.isExpired() || oldOTP.isUsed()) {
                    otpRepository.delete(oldOTP);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    /**
     * Clean up all expired OTPs (can be called periodically)
     */
    public void cleanupExpiredOTPs() {
        try {
            otpRepository.deleteExpiredOTPs(LocalDateTime.now());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
