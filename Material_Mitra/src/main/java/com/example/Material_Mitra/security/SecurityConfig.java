



package com.example.Material_Mitra.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow OPTIONS requests for CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // Public APIs
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/files/**").permitAll()
                .requestMatchers("/api/users/create-admin").permitAll()
                .requestMatchers("/jobs/active").permitAll()
                .requestMatchers("/api/forms/**").permitAll()
                .requestMatchers("/api/candidates/view/**").permitAll()
                .requestMatchers("/api/candidates/download/**").permitAll()
                .requestMatchers("/api/candidates/resume/**").permitAll()
                .requestMatchers("/candidates/resume/**").permitAll()

                // Admin-only (primary and secondary)
                .requestMatchers("/api/users/**").hasAnyAuthority("ADMIN", "SECONDARY_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/users/create-user").hasAnyAuthority("ADMIN", "SECONDARY_ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/users/create-secondary-admin").hasAuthority("ADMIN")
                .requestMatchers("/api/time-tracking/**").hasAnyAuthority("ADMIN", "SECONDARY_ADMIN")
                .requestMatchers("/api/user-activity/**").authenticated()
                .requestMatchers("/api/clients/**").hasAnyAuthority("ADMIN", "SECONDARY_ADMIN", "RECRUITER")
                .requestMatchers("/api/reports/recruiters").hasAnyAuthority("ADMIN", "SECONDARY_ADMIN")
                .requestMatchers("/api/reports/recruiters/**").hasAnyAuthority("ADMIN", "SECONDARY_ADMIN", "RECRUITER")

                // Authenticated users
                .requestMatchers("/api/applications/**").authenticated()
                .requestMatchers("/api/notifications/**").authenticated()
                .requestMatchers("/api/chatbot/**").authenticated()
                .requestMatchers("/jobs/**").authenticated()

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            // Local development
            "http://127.0.0.1:5501", 
            "http://localhost:5173", 
            "http://localhost:5174",
            "http://localhost:5175",
            // Private IP (local network)
            "http://192.168.1.38:9090",
            "https://192.168.1.38:9090",
            // Public IP (internet access) - both HTTP and HTTPS
            "http://112.133.204.15:9090",
            "https://112.133.204.15:9090",
            // Production domains
            "https://ats.primesourcellp.com",
            "http://ats.primesourcellp.com",
            "http://atsapi.primesourcellp.com",
            "https://atsapi.primesourcellp.com",
            "https://primesourcellp.com",
            "http://primesourcellp.com",
            "https://www.primesourcellp.com",
            "http://talentprime.primesourcellp.com",
            "https://talentprime.primesourcellp.com",
            // API subdomain (with and without port)
            "http://talentprimeapi.primesourcellp.com",
            "https://talentprimeapi.primesourcellp.com",
            "http://talentprimeapi.primesourcellp.com:9090",
            "https://talentprimeapi.primesourcellp.com:9090"
        ));
        // Allow all headers including ngrok-skip-browser-warning
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
