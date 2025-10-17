package com.example.Material_Mitra.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Material_Mitra.dto.LoginRequest;
import com.example.Material_Mitra.dto.LoginResponse;
import com.example.Material_Mitra.security.JwtUtil;
import com.example.Material_Mitra.security.UserDetailsServiceImpl;
import com.example.Material_Mitra.service.PasswordResetOTPService;

import jakarta.servlet.http.HttpServletRequest;
//@CrossOrigin(origins = "http://127.0.0.1:5501")
@RestController
@RequestMapping("/api/auth")
//@CrossOrigin(origins = "http://127.0.0.1:5501", allowCredentials = "true")
public class AuthController {

    @Autowired
    private UserDetailsServiceImpl customUserDetailsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private PasswordResetOTPService otpService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
        	UserDetails userDetails = customUserDetailsService.loadUserByUsername(loginRequest.getUsername());
            System.out.println("Raw password: " + loginRequest.getPassword());
            System.out.println("Encoded password in DB: " + userDetails.getPassword());
            System.out.println("Password matches? " + passwordEncoder.matches(loginRequest.getPassword(), userDetails.getPassword()));

            if (passwordEncoder.matches(loginRequest.getPassword(), userDetails.getPassword())) {
                String token = jwtUtil.generateToken(userDetails);
                String role = userDetails.getAuthorities().stream()
                                .findFirst()
                                .map(auth -> auth.getAuthority())
                                .orElse("");

                // Return successful login response with token and user info
                return ResponseEntity.ok(new LoginResponse(token, userDetails.getUsername(), role));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
            }
        } catch (Exception e) {
            // Log exception if needed
        	e.printStackTrace(); // Will show the real issue in your backend logs

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }
    }
    
  

        @PostMapping("/logout")
        public ResponseEntity<?> logout(HttpServletRequest request) {
            // Invalidate the token (if using a token blacklist or similar mechanism)
            String token = request.getHeader("Authorization").replace("Bearer ", "");
            // Add logic to invalidate the token (e.g., add it to a blacklist)
            return ResponseEntity.ok("Logged out successfully");
        }
        
        // DTOs for password reset
        public static class ForgotPasswordRequest {
            public String email;
        }
        
        public static class ResetPasswordRequest {
            public String email;
            public String otpCode;
            public String newPassword;
        }
        
        public static class VerifyOTPRequest {
            public String email;
            public String otpCode;
        }
        
        // Send OTP for password reset
        @PostMapping("/forgot-password")
        public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
            try {
                if (request.email == null || request.email.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("Email is required");
                }
                
                boolean success = otpService.generateAndSendOTP(request.email.trim());
                
                if (success) {
                    return ResponseEntity.ok("OTP sent successfully to your email");
                } else {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("Email is not registered. Please check your email address or contact support.");
                }
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("An error occurred. Please try again later.");
            }
        }
        
        // Verify OTP
        @PostMapping("/verify-otp")
        public ResponseEntity<?> verifyOTP(@RequestBody VerifyOTPRequest request) {
            try {
                if (request.email == null || request.email.trim().isEmpty() ||
                    request.otpCode == null || request.otpCode.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("Email and OTP code are required");
                }
                
                boolean isValid = otpService.verifyOTP(request.email.trim(), request.otpCode.trim());
                
                if (isValid) {
                    return ResponseEntity.ok("OTP verified successfully");
                } else {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Invalid or expired OTP");
                }
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("An error occurred. Please try again later.");
            }
        }
        
        // Reset password with OTP
        @PostMapping("/reset-password")
        public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
            try {
                if (request.email == null || request.email.trim().isEmpty() ||
                    request.otpCode == null || request.otpCode.trim().isEmpty() ||
                    request.newPassword == null || request.newPassword.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("Email, OTP code, and new password are required");
                }
                
                if (request.newPassword.length() < 6) {
                    return ResponseEntity.badRequest().body("Password must be at least 6 characters long");
                }
                
                boolean success = otpService.verifyOTPAndResetPassword(
                    request.email.trim(), 
                    request.otpCode.trim(), 
                    request.newPassword.trim()
                );
                
                if (success) {
                    return ResponseEntity.ok("Password reset successfully");
                } else {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Invalid or expired OTP");
                }
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("An error occurred. Please try again later.");
            }
        }
        
        // Test email configuration
        @PostMapping("/test-email")
        public ResponseEntity<?> testEmail(@RequestBody ForgotPasswordRequest request) {
            try {
                if (request.email == null || request.email.trim().isEmpty()) {
                    return ResponseEntity.badRequest().body("Email is required");
                }
                
                // Send a test OTP
                boolean success = otpService.generateAndSendOTP(request.email.trim());
                
                if (success) {
                    return ResponseEntity.ok("Test email sent successfully to: " + request.email);
                } else {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("Email is not registered: " + request.email);
                }
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Email configuration error: " + e.getMessage());
            }
        }
        
        // Debug endpoint to check users
        @GetMapping("/debug/users")
        public ResponseEntity<?> debugUsers() {
            try {
                // This is a temporary debug endpoint - remove in production
                return ResponseEntity.ok("Debug endpoint - check application logs for user details");
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error: " + e.getMessage());
            }
        }
    }

