package com.example.Material_Mitra.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    public void sendOTPEmail(String toEmail, String otpCode) {
        try {
            System.out.println("=== EMAIL DEBUG INFO ===");
            System.out.println("Attempting to send OTP email to: " + toEmail);
            System.out.println("OTP Code: " + otpCode);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Password Reset OTP - ATS System");
            message.setText(buildOTPEmailContent(otpCode));
            message.setFrom("rselvaragavansri@gmail.com"); // Set explicit sender
            
            System.out.println("Email message prepared, sending...");
            mailSender.send(message);
            System.out.println("✅ OTP email sent successfully to: " + toEmail);
            System.out.println("=== EMAIL SENT SUCCESSFULLY ===");
        } catch (Exception e) {
            System.err.println("❌ Failed to send OTP email to: " + toEmail);
            System.err.println("Error details: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        }
    }
    
    private String buildOTPEmailContent(String otpCode) {
        return String.format("""
            Dear User,
            
            You have requested to reset your password for the ATS (Applicant Tracking System).
            
            Your One-Time Password (OTP) is: %s
            
            This OTP is valid for 10 minutes only.
            
            If you did not request this password reset, please ignore this email.
            
            For security reasons, please do not share this OTP with anyone.
            
            Best regards,
            ATS System Team
            """, otpCode);
    }
}
