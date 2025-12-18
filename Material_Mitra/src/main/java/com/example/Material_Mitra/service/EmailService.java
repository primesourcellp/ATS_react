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
    
    public void sendUserCredentialsEmail(String toEmail, String username, String password, String role, Long userId) {
        try {
            System.out.println("=== SENDING USER CREDENTIALS EMAIL ===");
            System.out.println("To: " + toEmail);
            System.out.println("Username: " + username);
            System.out.println("Role: " + role);
            System.out.println("User ID: " + userId);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Welcome to TalentPrime - Your Account Credentials");
            message.setText(buildUserCredentialsEmailText(username, password, role, userId, toEmail));
            message.setFrom("noreply@primesourcellp.com");
            
            System.out.println("Email message prepared, sending...");
            mailSender.send(message);
            System.out.println("✅ User credentials email sent successfully to: " + toEmail);
            System.out.println("=== EMAIL SENT SUCCESSFULLY ===");
        } catch (Exception e) {
            System.err.println("❌ Failed to send user credentials email to: " + toEmail);
            System.err.println("Error details: " + e.getMessage());
            e.printStackTrace();
            // Don't throw exception - user creation should still succeed even if email fails
            System.err.println("⚠️ User created but email notification failed. User can still login with provided credentials.");
        }
    }
    
    private String buildUserCredentialsEmailText(String username, String password, String role, Long userId, String email) {
        return String.format("""
            Dear %s,
            
            Welcome to TalentPrime!
            
            Your account has been successfully created. Please find your login credentials below:
            
            User ID: %d
            Username: %s
            Email: %s
            Password: %s
            Role: %s
            
            Please keep these credentials secure and do not share them with anyone.
            
            You can now log in to the TalentPrime system using your username and password at:
            https://talentprime.primesourcellp.com/
            
            If you have any questions or need assistance, please contact the system administrator.
            
            Best regards,
            TalentPrime Team
            """, username, userId, username, email, password, role);
    }
    
    public void sendCandidateInvitationEmail(String toEmail, String candidateName, String companyUrl) {
        sendCandidateInvitationEmail(toEmail, candidateName, companyUrl, null);
    }
    
    public void sendCandidateInvitationEmail(String toEmail, String candidateName, String companyUrl, String customMessage) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Explore Exciting Career Opportunities with Us");
            
            String emailText;
            if (customMessage != null && !customMessage.trim().isEmpty()) {
                // Use custom message, but replace URL placeholder if present
                emailText = customMessage.replace("{{URL}}", companyUrl != null ? companyUrl : "https://www.primesourcellp.com");
            } else {
                emailText = buildCandidateInvitationEmailText(candidateName, companyUrl);
            }
            
            message.setText(emailText);
            message.setFrom("noreply@primesourcellp.com");
            
            mailSender.send(message);
            System.out.println("✅ Candidate invitation email sent to: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Failed to send candidate invitation email to: " + toEmail);
            System.err.println("Error: " + e.getMessage());
            // Don't throw - continue with other emails
        }
    }
    
    public String getCandidateInvitationEmailPreview(String candidateName, String companyUrl) {
        return buildCandidateInvitationEmailText(null, companyUrl);
    }
    
    private String buildCandidateInvitationEmailText(String candidateName, String companyUrl) {
        String url = companyUrl != null && !companyUrl.trim().isEmpty() ? companyUrl : "https://www.primesourcellp.com";
        
        return String.format("""
            Dear Sir/Mam,
            
            We hope this message finds you well!
            
            We are excited to invite you to explore the exciting career opportunities available at our company. We have a wide range of job openings across various departments and skill levels.
            
            Visit our website to browse all available positions and learn more about our services:
            %s
            
            Our company offers:
            - Website Development
            - Web Application Development
            - Mobile Application Development
            - Global HR & Staffing Solutions
            - HR Payroll
            - Payroll Management
            
            We encourage you to visit our website regularly as we frequently update our job listings with new opportunities.
            
            If you have any questions or would like to learn more about specific positions, please don't hesitate to reach out to us.
            
            Thank you for your interest in joining our team!
            
            Best regards,
            Primesourcellp Team
            """, url);
    }
}
