package com.company.medtech.lab.repository;

import com.company.medtech.lab.model.LabTestBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LabTestBookingRepository extends JpaRepository<LabTestBooking, UUID> {

    List<LabTestBooking> findByFranchiseIdOrderByCreatedAtDesc(UUID franchiseId);

    Optional<LabTestBooking> findByIdAndFranchiseId(UUID id, UUID franchiseId);
}
