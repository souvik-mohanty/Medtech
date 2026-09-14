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
}
