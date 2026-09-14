package com.company.medtech.patient.repository;

import com.company.medtech.patient.model.PatientAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientAddressRepository extends JpaRepository<PatientAddress, UUID> {

    List<PatientAddress> findByPatientProfileId(UUID patientProfileId);

    Optional<PatientAddress> findByIdAndPatientProfileId(UUID id, UUID patientProfileId);
}
