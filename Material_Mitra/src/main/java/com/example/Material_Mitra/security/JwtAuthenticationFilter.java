package com.example.Material_Mitra.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.Material_Mitra.service.UserActivityService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired(required = false)
    @Lazy
    private UserActivityService userActivityService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
    	
    	// Skip JWT authentication for public endpoints
    	String requestPath = request.getRequestURI();
    	if (requestPath.startsWith("/api/files") || 
    	    requestPath.startsWith("/api/forms/apply/") ||
    	    requestPath.equals("/api/forms") ||
    	    (requestPath.startsWith("/api/forms/") && requestPath.contains("/resume/"))) {
    		filterChain.doFilter(request, response);
    		return;
    	}

        final String authHeader = request.getHeader("Authorization");
        String username = null;
        String jwt = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                // log invalid token or ignore to continue without auth
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            if (jwtUtil.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = 
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                    );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                
                // Update user activity on any API call (GET, POST, PUT, DELETE, PATCH)
                // This ensures AWAY status immediately changes to ONLINE when user interacts
                if (userActivityService != null && shouldUpdateActivity(requestPath)) {
                    try {
                        userActivityService.updateCurrentUserActivity();
                    } catch (Exception e) {
                        // Don't fail request if activity tracking fails
                        System.err.println("Failed to update user activity: " + e.getMessage());
                    }
                }
            }
        } else if (username != null && SecurityContextHolder.getContext().getAuthentication() != null) {
            // User already authenticated, update activity on any API call
            // This ensures AWAY status immediately changes to ONLINE when user interacts
            if (userActivityService != null && shouldUpdateActivity(requestPath)) {
                try {
                    userActivityService.updateCurrentUserActivity();
                } catch (Exception e) {
                    // Don't fail request if activity tracking fails
                }
            }
        }

        filterChain.doFilter(request, response);
    }
    
    /**
     * Determine if activity should be updated for this request
     * Excludes background/polling endpoints to allow AWAY status
     * Updates on any real user interaction (including GET for navigation/clicks)
     */
    private boolean shouldUpdateActivity(String requestPath) {
        // Don't update activity for background/polling endpoints
        // These are auto-refreshed and shouldn't keep user ONLINE
        if (requestPath.equals("/api/user-activity/ping") ||
            requestPath.equals("/api/user-activity/update-all") ||
            requestPath.startsWith("/api/time-tracking/active") ||
            requestPath.startsWith("/api/time-tracking/user/") ||
            requestPath.startsWith("/api/time-tracking/current") ||
            requestPath.startsWith("/api/notifications") ||
            requestPath.startsWith("/api/user-activity/all")) {
            return false;
        }
        
        // Update activity on ALL other API calls (GET, POST, PUT, DELETE, PATCH)
        // This ensures when user clicks/navigates (GET) or interacts (POST/PUT/DELETE),
        // status immediately changes from AWAY to ONLINE
        return true;
    }
}
