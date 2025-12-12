package com.example.Material_Mitra.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Material_Mitra.dto.TimeTrackingDTO;
import com.example.Material_Mitra.service.TimeTrackingService;

@RestController
@RequestMapping("/api/time-tracking")
public class TimeTrackingController {

    @Autowired
    private TimeTrackingService timeTrackingService;

    @PostMapping("/login/{userId}")
    public ResponseEntity<TimeTrackingDTO> recordLogin(@PathVariable Long userId) {
        try {
            TimeTrackingDTO tracking = timeTrackingService.recordLogin(userId);
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/logout/{userId}")
    public ResponseEntity<TimeTrackingDTO> recordLogout(@PathVariable Long userId) {
        try {
            TimeTrackingDTO tracking = timeTrackingService.recordLogout(userId);
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<TimeTrackingDTO>> getAllActiveSessions() {
        List<TimeTrackingDTO> activeSessions = timeTrackingService.getAllActiveSessions();
        return ResponseEntity.ok(activeSessions);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TimeTrackingDTO>> getUserSessions(@PathVariable Long userId) {
        try {
            List<TimeTrackingDTO> sessions = timeTrackingService.getUserSessions(userId);
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/user/{userId}/date")
    public ResponseEntity<List<TimeTrackingDTO>> getUserSessionsByDate(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            List<TimeTrackingDTO> sessions = timeTrackingService.getUserSessionsByDate(userId, date);
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/current")
    public ResponseEntity<TimeTrackingDTO> getCurrentUserSession() {
        TimeTrackingDTO session = timeTrackingService.getCurrentUserSession();
        if (session == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(session);
    }

    @GetMapping("/user/{userId}/total-today")
    public ResponseEntity<Map<String, Object>> getTotalWorkingMinutesToday(@PathVariable Long userId) {
        try {
            Long totalMinutes = timeTrackingService.getTotalWorkingMinutesToday(userId);
            long hours = totalMinutes / 60;
            long minutes = totalMinutes % 60;
            return ResponseEntity.ok(Map.of(
                "totalMinutes", totalMinutes,
                "hours", hours,
                "minutes", minutes,
                "formatted", hours + "h " + minutes + "m"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/cleanup-stale")
    public ResponseEntity<Map<String, Object>> cleanupStaleSessions() {
        try {
            int cleanedCount = timeTrackingService.cleanupStaleSessions();
            return ResponseEntity.ok(Map.of(
                "cleanedCount", cleanedCount,
                "message", "Cleaned up " + cleanedCount + " stale sessions"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

