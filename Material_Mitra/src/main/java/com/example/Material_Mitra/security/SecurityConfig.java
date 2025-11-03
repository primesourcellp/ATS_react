

// package com.example.Material_Mitra.security;

// import java.util.List;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.http.HttpMethod;
// import org.springframework.security.authentication.AuthenticationManager;
// import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
// import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.config.http.SessionCreationPolicy;
// import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.security.web.SecurityFilterChain;
// import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
// import org.springframework.web.cors.CorsConfiguration;
// import org.springframework.web.cors.CorsConfigurationSource;
// import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// @Configuration
// @EnableMethodSecurity
// public class SecurityConfig {

//     private final UserDetailsServiceImpl userDetailsService;
//     private final JwtAuthenticationFilter jwtAuthenticationFilter;

//     public SecurityConfig(UserDetailsServiceImpl userDetailsService,
//                           JwtAuthenticationFilter jwtAuthenticationFilter) {
//         this.userDetailsService = userDetailsService;
//         this.jwtAuthenticationFilter = jwtAuthenticationFilter;
//     }

//     // Encoder for password hashing
//     @Bean
//     public PasswordEncoder passwordEncoder() {
//         return new BCryptPasswordEncoder();
//     }

//     // AuthenticationManager bean
//     @Bean
//     public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
//         return config.getAuthenticationManager();
//     }

//     // Main security filter chain
//     @Bean
//     public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//         http
//             .csrf(csrf -> csrf.disable())
//             .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
//             .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//             .authorizeHttpRequests(auth -> auth
//                 .requestMatchers("/api/files/**").permitAll()
//                 .requestMatchers("/api/auth/**").permitAll()
//                 .requestMatchers("/api/users/create-admin").permitAll()
//                 .requestMatchers("/jobs/active").permitAll()
//                 .requestMatchers("/api/forms/apply/**").permitAll()
//                 .requestMatchers("/api/forms").permitAll()
//                 .requestMatchers("/api/forms/*/resume/**").permitAll()
//                 .requestMatchers("/api/candidates/view/**").permitAll()
//                 .requestMatchers("/api/candidates/download/**").permitAll()
//                 .requestMatchers("/api/candidates/resume/**").permitAll()
//                 .requestMatchers("/api/applications/*/resume/**").permitAll()
//                 .requestMatchers("/api/applications/*/resume/file").permitAll()
//                 .requestMatchers("/api/notifications/**").authenticated()
//                 .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

// //                .requestMatchers("/jobs/**").permitAll()

//                 .requestMatchers("/api/users/**").hasAuthority("ADMIN")
//                 .requestMatchers(HttpMethod.POST, "/api/users/create-user").hasAnyRole("ADMIN") 
//                 .requestMatchers("/api/applications/**").authenticated() 
//                 .anyRequest().authenticated()
//             )
//             .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

//         return http.build();
//     }

//     // CORS config to allow frontend requests
//     @Bean
//     public CorsConfigurationSource corsConfigurationSource() {
        
//         CorsConfiguration config = new CorsConfiguration();
//         config.setAllowedOrigins(List.of("http://127.0.0.1:5501", "http://localhost:5173","http://localhost:5174","https://ats.primesourcellp.com")); // Allow VS Code Live Server
//         config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH","OPTIONS"));
//         config.setAllowedHeaders(List.of("*"));
//         config.setAllowCredentials(true); // Allow credentials (e.g., Authorization header)
//         config.setMaxAge(3600L);

//         UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//         source.registerCorsConfiguration("/**", config);
//         return source;
//     }
// }





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

                // Admin-only
                .requestMatchers("/api/users/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/users/create-user").hasAuthority("ADMIN")

                // Authenticated users
                .requestMatchers("/api/applications/**").authenticated()
                .requestMatchers("/api/notifications/**").authenticated()
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
            "http://127.0.0.1:5501", 
            "http://localhost:5173", 
            "http://localhost:5174",
            "http://localhost:5175",
            "https://ats.primesourcellp.com",
            "http://ats.primesourcellp.com",
            "http://atsapi.primesourcellp.com",
            "https://atsapi.primesourcellp.com",
            "https://primesourcellp.com",
            "http://primesourcellp.com",
             "https://www.primesourcellp.com"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
