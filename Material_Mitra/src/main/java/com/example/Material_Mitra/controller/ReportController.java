package com.example.Material_Mitra.controller;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Material_Mitra.dto.RecruiterReportDTO;
import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.enums.RoleStatus;
import com.example.Material_Mitra.service.ReportService;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/recruiters")
    public ResponseEntity<?> getRecruiterReports(
            @RequestParam(value = "range", required = false) String range,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "recruiterId", required = false) Long recruiterId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!hasAnyAuthority(authentication, RoleStatus.ADMIN.name(), RoleStatus.SECONDARY_ADMIN.name())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You do not have permission to view recruiter reports.");
        }

        ReportService.DateRange dateRange = reportService.resolveRange(range, startDate, endDate);

        if (recruiterId != null) {
            Optional<User> recruiterOpt = reportService.findRecruiterById(recruiterId);
            if (recruiterOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Recruiter not found with id: " + recruiterId);
            }
            RecruiterReportDTO report = reportService.getReportForRecruiter(
                    recruiterOpt.get(), dateRange.getStartDate(), dateRange.getEndDate());
            return ResponseEntity.ok(Collections.singletonList(report));
        }

        List<RecruiterReportDTO> reports = reportService.getReportsForAllRecruiters(
                dateRange.getStartDate(), dateRange.getEndDate());
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/recruiters/me")
    public ResponseEntity<?> getMyReport(
            @RequestParam(value = "range", required = false) String range,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
        }

        if (!hasAnyAuthority(authentication,
                RoleStatus.RECRUITER.name(),
                RoleStatus.SECONDARY_ADMIN.name(),
                RoleStatus.ADMIN.name())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You do not have permission to view this report.");
        }

        String username = authentication.getName();
        Optional<User> userOpt = reportService.findRecruiterByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found for report generation.");
        }

        ReportService.DateRange dateRange = reportService.resolveRange(range, startDate, endDate);
        RecruiterReportDTO report = reportService.getReportForRecruiter(
                userOpt.get(), dateRange.getStartDate(), dateRange.getEndDate());
        return ResponseEntity.ok(report);
    }

    private boolean hasAnyAuthority(Authentication authentication, String... authorities) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        List<String> authList = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        for (String required : authorities) {
            if (authList.contains(required)) {
                return true;
            }
        }
        return false;
    }
}

