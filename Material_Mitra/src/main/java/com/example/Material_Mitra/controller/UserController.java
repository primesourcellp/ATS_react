package com.example.Material_Mitra.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.enums.RoleStatus;
import com.example.Material_Mitra.security.JwtUtil;
import com.example.Material_Mitra.security.UserDetailsServiceImpl;
import com.example.Material_Mitra.service.UserService;

@RestController
@RequestMapping("/api/users")
//@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserDetailsServiceImpl customUserDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    // DTO for login request
    public static class LoginRequest {
        public String username;
        public String password;

        // getters/setters if needed
    }

    // DTO for login response
    public static class LoginResponse {
        public String token;
        public String username;
        public String role;

        public LoginResponse(String token, String username, String role) {
            this.token = token;
            this.username = username;
            this.role = role;
        }

        // getters/setters if needed
    }

    // 1. Check if admin user exists
    @GetMapping("/admin-exists")
    public ResponseEntity<Boolean> adminExists() {
        boolean exists = userService.isAdminPresent();
        return ResponseEntity.ok(exists);
    }

    // 2. Register first admin (only one allowed)
    @PostMapping("/create-admin")
    public ResponseEntity<?> registerAdmin(@RequestBody User user) {
        if (userService.isAdminPresent()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admin already exists");
        }
        user.setRole(RoleStatus.ADMIN);
//        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userService.createAdmin(user);
        return ResponseEntity.ok("Admin registered successfully");
    }

    // 3. Admin creates recruiter (many allowed)
    @PostMapping("/create-recruiter")
    public ResponseEntity<?> createRecruiter(@RequestBody User user) {
        try {
            user.setRole(RoleStatus.RECRUITER);
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            userService.createRecruiter(user);
            return ResponseEntity.ok("Recruiter created successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }
    @PostMapping("/create-user")
    public ResponseEntity<?> createUser(@RequestBody User user) {
    	 try {
             user.setRole(RoleStatus.SUB_USER);
             user.setPassword(passwordEncoder.encode(user.getPassword()));
             userService.createUser(user);
             return ResponseEntity.ok("User created successfully");
         } catch (RuntimeException e) {
             return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
         }
    	
//        return ResponseEntity.ok(userService.createUser(user));
    }
    // 4. Get all users
//    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // 5. Get user by ID
//    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 6. Get user by username
//    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/username/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        return userService.getUserByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Check if email exists
    @GetMapping("/check-email/{email}")
    public ResponseEntity<?> checkEmailExists(@PathVariable String email) {
        try {
            List<User> users = userService.getUsersByEmail(email);
            boolean exists = !users.isEmpty();
            return ResponseEntity.ok(Map.of("exists", exists, "count", users.size()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error checking email: " + e.getMessage());
        }
    }
    
    // Check if username exists
    @GetMapping("/check-username/{username}")
    public ResponseEntity<?> checkUsernameExists(@PathVariable String username) {
        try {
            Optional<User> user = userService.getUserByUsername(username);
            boolean exists = user.isPresent();
            return ResponseEntity.ok(Map.of("exists", exists));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error checking username: " + e.getMessage());
        }
    }

    // 7. Update user (admin only)
//    @PreAuthorize("hasRole('ADMIN')")
//    @PutMapping("/{id}")
//    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user) {
//        try {
//            // encode password if updated
//            if (user.getPassword() != null && !user.getPassword().isEmpty()) {
//                user.setPassword(passwordEncoder.encode(user.getPassword()));
//            }
//            User updatedUser = userService.updateUser(id, user);
//            return ResponseEntity.ok(updatedUser);
//        } catch (RuntimeException e) {
//            return ResponseEntity.badRequest().body(e.getMessage());
//        }
//    }
    
 // Update user
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            User updatedUser = userService.updateUser(id, user); // Service handles encoding
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    // 8. Delete user (admin only)
//    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        boolean deleted = userService.deleteUser(id);
        if (deleted) {
            return ResponseEntity.ok("User with ID " + id + " deleted.");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User with ID " + id + " not found.");
        }
    }

//     9. Login endpoint: returns JWT token on success
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(loginRequest.username);

            if (passwordEncoder.matches(loginRequest.password, userDetails.getPassword())) {
                String token = jwtUtil.generateToken(userDetails);
                String role = userDetails.getAuthorities().stream()
                                .findFirst()
                                .map(auth -> auth.getAuthority())
                                .orElse("");
                return ResponseEntity.ok(new LoginResponse(token, userDetails.getUsername(), role));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
        }
    }

}
