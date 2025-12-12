package com.example.Material_Mitra.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Material_Mitra.entity.User;
import com.example.Material_Mitra.entity.UserActivity;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {

    Optional<UserActivity> findByUser(User user);

    Optional<UserActivity> findByUser_Id(Long userId);

    @Query("SELECT ua FROM UserActivity ua WHERE ua.status = :status")
    List<UserActivity> findByStatus(@Param("status") String status);

    @Query("SELECT ua FROM UserActivity ua WHERE ua.status = 'ONLINE' OR ua.status = 'AWAY' ORDER BY ua.lastActivityTime DESC")
    List<UserActivity> findActiveUsers();

    @Query("SELECT ua FROM UserActivity ua WHERE ua.lastActivityTime < :thresholdTime")
    List<UserActivity> findInactiveUsers(@Param("thresholdTime") LocalDateTime thresholdTime);
}

