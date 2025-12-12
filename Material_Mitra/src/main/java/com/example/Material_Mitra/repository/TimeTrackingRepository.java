package com.example.Material_Mitra.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Material_Mitra.entity.TimeTracking;
import com.example.Material_Mitra.entity.User;

@Repository
public interface TimeTrackingRepository extends JpaRepository<TimeTracking, Long> {

    // Find active session for a user (must have login time and no logout time)
    @Query("SELECT t FROM TimeTracking t WHERE t.user = :user " +
           "AND t.isActive = true AND t.loginTime IS NOT NULL AND t.logoutTime IS NULL")
    Optional<TimeTracking> findByUserAndIsActiveTrue(@Param("user") User user);

    // Find all active sessions
    List<TimeTracking> findByIsActiveTrue();

    // Find all sessions for a user
    List<TimeTracking> findByUserOrderByLoginTimeDesc(User user);

    // Find sessions for a user on a specific date
    @Query("SELECT t FROM TimeTracking t WHERE t.user = :user " +
           "AND DATE(t.loginTime) = :date ORDER BY t.loginTime DESC")
    List<TimeTracking> findByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);

    // Find sessions for a user between dates
    @Query("SELECT t FROM TimeTracking t WHERE t.user = :user " +
           "AND t.loginTime >= :startDate AND t.loginTime <= :endDate " +
           "ORDER BY t.loginTime DESC")
    List<TimeTracking> findByUserAndDateRange(@Param("user") User user, 
                                               @Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);

    // Find all active sessions (currently working users)
    // Only return sessions that are active, have login time, and no logout time
    @Query("SELECT t FROM TimeTracking t WHERE t.isActive = true " +
           "AND t.loginTime IS NOT NULL AND t.logoutTime IS NULL " +
           "ORDER BY t.loginTime DESC")
    List<TimeTracking> findAllActiveSessions();

    // Get total working minutes for a user on a specific date (ONLINE time only)
    @Query("SELECT COALESCE(SUM(t.onlineMinutes), 0) FROM TimeTracking t " +
           "WHERE t.user = :user AND DATE(t.loginTime) = :date")
    Long getTotalWorkingMinutesByUserAndDate(@Param("user") User user, @Param("date") LocalDate date);

    // Get total working minutes for a user in date range
    @Query("SELECT COALESCE(SUM(t.workingMinutes), 0) FROM TimeTracking t " +
           "WHERE t.user = :user AND t.loginTime >= :startDate AND t.loginTime <= :endDate")
    Long getTotalWorkingMinutesByUserAndDateRange(@Param("user") User user,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);
}

