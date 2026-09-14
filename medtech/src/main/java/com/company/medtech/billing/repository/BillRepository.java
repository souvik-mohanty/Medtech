package com.company.medtech.billing.repository;

import com.company.medtech.billing.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillRepository extends JpaRepository<Bill, UUID> {

    List<Bill> findByFranchiseIdOrderByCreatedAtDesc(UUID franchiseId);

    Optional<Bill> findByIdAndFranchiseId(UUID id, UUID franchiseId);
}
