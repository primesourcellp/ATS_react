package com.example.Material_Mitra.security;

import java.util.Collections;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.repository.UserRepository;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        // Try to find by username first
        Optional<User> userOptional = userRepository.findByUsername(usernameOrEmail);
        
        // If not found by username, try to find by email
        if (!userOptional.isPresent()) {
            userOptional = userRepository.findByEmail(usernameOrEmail);
        }
        
        User user = userOptional
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Using your enum role directly
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().name());

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                Collections.singleton(authority) // only one role per user
        );
    }
}
