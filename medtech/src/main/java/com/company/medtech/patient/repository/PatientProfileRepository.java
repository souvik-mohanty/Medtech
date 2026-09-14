package com.company.medtech.patient.repository;

import com.company.medtech.patient.model.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, UUID> {

    Optional<PatientProfile> findByUserId(UUID userId);
}
