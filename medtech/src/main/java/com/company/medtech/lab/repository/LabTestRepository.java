package com.company.medtech.lab.repository;

import com.company.medtech.lab.model.LabTest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LabTestRepository extends JpaRepository<LabTest, UUID> {

    List<LabTest> findByFranchiseIdAndActiveTrue(UUID franchiseId);

    /** Owner-facing catalog management sees everything, active and inactive. */
    List<LabTest> findByFranchiseIdOrderByNameAsc(UUID franchiseId);

    Optional<LabTest> findByIdAndFranchiseId(UUID id, UUID franchiseId);
}
