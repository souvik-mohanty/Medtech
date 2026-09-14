package com.company.medtech.lab.repository;

import com.company.medtech.lab.model.LabTestCombo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LabTestComboRepository extends JpaRepository<LabTestCombo, UUID> {

    List<LabTestCombo> findByFranchiseIdAndActiveTrue(UUID franchiseId);

    Optional<LabTestCombo> findByIdAndFranchiseId(UUID id, UUID franchiseId);
}
