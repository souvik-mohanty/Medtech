package com.company.medtech.notification.repository;

import com.company.medtech.notification.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByFranchiseIdOrderByCreatedAtDesc(UUID franchiseId);

    List<Notification> findByPatientEmailOrderByCreatedAtDesc(String patientEmail);

    Optional<Notification> findByIdAndPatientEmail(UUID id, String patientEmail);

    long countByFranchiseIdAndReadFalse(UUID franchiseId);

    long countByPatientEmailAndReadFalse(String patientEmail);
}
