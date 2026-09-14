package com.company.medtech.patient.repository;

import com.company.medtech.patient.model.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, UUID> {

    List<FamilyMember> findByPatientProfileId(UUID patientProfileId);

    Optional<FamilyMember> findByIdAndPatientProfileId(UUID id, UUID patientProfileId);
}
