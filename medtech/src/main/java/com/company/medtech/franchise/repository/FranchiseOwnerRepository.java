package com.company.medtech.franchise.repository;

import com.company.medtech.franchise.model.FranchiseOwner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FranchiseOwnerRepository extends JpaRepository<FranchiseOwner, UUID> {

    Optional<FranchiseOwner> findByOwnerEmail(String ownerEmail);

    List<FranchiseOwner> findByFranchiseId(UUID franchiseId);
}
