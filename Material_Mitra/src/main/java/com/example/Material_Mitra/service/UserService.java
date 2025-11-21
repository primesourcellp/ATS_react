package com.example.Material_Mitra.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.Material_Mitra.entity.Candidate;
import com.example.Material_Mitra.entity.Interview;
import com.example.Material_Mitra.entity.JobApplication;
import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.enums.RoleStatus;
import com.example.Material_Mitra.repository.CandidateRepository;
import com.example.Material_Mitra.repository.InterviewRepository;
import com.example.Material_Mitra.repository.JobApplicationRepository;
import com.example.Material_Mitra.repository.UserRepository;


@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private InterviewRepository interviewRepository;



    public User createAdmin(User user) {
        boolean adminExists = userRepository.existsByRole(RoleStatus.ADMIN);
        if (adminExists) {
            throw new RuntimeException("Primary admin already exists. Please create a secondary admin instead.");
        }
        
        // Validate required fields
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Username is required");
        }
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            throw new RuntimeException("Password is required");
        }
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        
        // Check if username already exists
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        
        user.setRole(RoleStatus.ADMIN);
        System.out.println("Encoding password for admin: " + user.getPassword());
        user.setPassword(passwordEncoder.encode(user.getPassword())); 
        System.out.println("Encoded password: " + user.getPassword());
        return userRepository.save(user);
    }

    
    public User createRecruiter(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username '" + user.getUsername() + "' already exists.");
        }
        user.setRole(RoleStatus.RECRUITER);
        user.setPassword(passwordEncoder.encode(user.getPassword())); 
        return userRepository.save(user);
    }

    
 // Create normal user
    public User createUser(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists.");
        }
        user.setRole(RoleStatus.SUB_USER);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User createSecondaryAdmin(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username '" + user.getUsername() + "' already exists.");
        }
        user.setRole(RoleStatus.SECONDARY_ADMIN);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

   
    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        System.out.println("=== DEBUG: All Users in Database ===");
        for (User user : users) {
            System.out.println("User ID: " + user.getId() + 
                             ", Username: " + user.getUsername() + 
                             ", Email: " + user.getEmail() + 
                             ", Role: " + user.getRole());
        }
        System.out.println("=== END DEBUG ===");
        return users;
    }

  
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

   
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }


    
    public User updateUser(Long id, User updatedUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        // If editing an admin user, prevent role changes
        boolean isAdmin = user.getRole().equals(RoleStatus.ADMIN);
        
        if (isAdmin) {
            // For admin users, only allow username, email, and password updates
            // Role cannot be changed
            user.setUsername(updatedUser.getUsername());
            user.setEmail(updatedUser.getEmail());
            
            // ✅ Encode only if password is provided
            if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
            }
            // Role remains unchanged for admin users
            return userRepository.save(user);
        }

        // For non-admin users, allow role changes with restrictions
        // Prevent multiple admins (only if changing TO admin role)
        if (updatedUser.getRole() == RoleStatus.ADMIN && !user.getRole().equals(RoleStatus.ADMIN)) {
            boolean adminExists = userRepository.existsByRole(RoleStatus.ADMIN);
            if (adminExists) {
                throw new RuntimeException("Admin user already exists. Only one admin allowed.");
            }
        }

        user.setUsername(updatedUser.getUsername());
        user.setEmail(updatedUser.getEmail()); // ✅ Add email update

        // ✅ Encode only if password is provided
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
        }

        // Only update role if provided (for non-admin users)
        if (updatedUser.getRole() != null) {
            user.setRole(updatedUser.getRole());
        }
        
        return userRepository.save(user);
    }
  
    public boolean deleteUser(Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();

        List<Candidate> ownedCandidates = candidateRepository.findByCreatedBy_Id(user.getId());
        if (!ownedCandidates.isEmpty()) {
            ownedCandidates.forEach(candidate -> {
                if (candidate.getCreatedByName() == null || candidate.getCreatedByName().isBlank()) {
                    candidate.setCreatedByName(user.getUsername());
                }
                if (candidate.getCreatedByEmail() == null || candidate.getCreatedByEmail().isBlank()) {
                    candidate.setCreatedByEmail(user.getEmail());
                }
                if (candidate.getCreatedByUserId() == null) {
                    candidate.setCreatedByUserId(user.getId());
                }
                candidate.setCreatedBy(null);
            });
            candidateRepository.saveAll(ownedCandidates);
        }

        List<JobApplication> ownedApplications = jobApplicationRepository.findByCreatedBy_Id(user.getId());
        if (!ownedApplications.isEmpty()) {
            ownedApplications.forEach(app -> {
                if (app.getCreatedByName() == null || app.getCreatedByName().isBlank()) {
                    app.setCreatedByName(user.getUsername());
                }
                if (app.getCreatedByEmail() == null || app.getCreatedByEmail().isBlank()) {
                    app.setCreatedByEmail(user.getEmail());
                }
                if (app.getCreatedByUserId() == null) {
                    app.setCreatedByUserId(user.getId());
                }
                app.setCreatedBy(null);
            });
            jobApplicationRepository.saveAll(ownedApplications);
        }

        List<Interview> scheduledInterviews = interviewRepository.findByScheduledBy_Id(user.getId());
        if (!scheduledInterviews.isEmpty()) {
            scheduledInterviews.forEach(interview -> {
                if (interview.getScheduledByName() == null || interview.getScheduledByName().isBlank()) {
                    interview.setScheduledByName(user.getUsername());
                }
                if (interview.getScheduledByEmail() == null || interview.getScheduledByEmail().isBlank()) {
                    interview.setScheduledByEmail(user.getEmail());
                }
                if (interview.getScheduledByUserId() == null) {
                    interview.setScheduledByUserId(user.getId());
                }
                interview.setScheduledBy(null);
            });
            interviewRepository.saveAll(scheduledInterviews);
        }

        userRepository.delete(user);
        return true;
    }

    
    public boolean isAdminPresent() {
        return userRepository.existsByRole(RoleStatus.ADMIN);
    }




}
