package com.company.medtech.lab.repository;

import com.company.medtech.lab.model.LabReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LabReportRepository extends JpaRepository<LabReport, UUID> {

    Optional<LabReport> findByBookingId(UUID bookingId);

    boolean existsByBookingId(UUID bookingId);

    /** Used by LabReportService's daily cleanup job — see that class for the retention period. */
    List<LabReport> findByUploadedAtBefore(LocalDateTime cutoff);
}
