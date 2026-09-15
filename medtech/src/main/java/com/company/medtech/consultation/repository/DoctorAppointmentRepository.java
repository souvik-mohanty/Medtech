package com.company.medtech.consultation.repository;

import com.company.medtech.consultation.model.DoctorAppointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DoctorAppointmentRepository extends JpaRepository<DoctorAppointment, UUID> {

    List<DoctorAppointment> findByFranchiseIdOrderByCreatedAtDesc(UUID franchiseId);

    List<DoctorAppointment> findByPatientEmailOrderByCreatedAtDesc(String patientEmail);

    Optional<DoctorAppointment> findByIdAndFranchiseId(UUID id, UUID franchiseId);

    /** How many patients on this schedule have already been seen — used to derive the current FIFO serving number. */
    long countByScheduleIdAndCompletedTrue(UUID scheduleId);

    /** Blocks a patient from booking the same schedule twice online (owner walk-ins are exempt — see bookWalkInAppointment). */
    boolean existsByScheduleIdAndPatientEmail(UUID scheduleId, String patientEmail);
}
