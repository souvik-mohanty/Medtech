package com.company.medtech.referral.repository;

import com.company.medtech.referral.model.Referral;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReferralRepository extends JpaRepository<Referral, UUID> {

    List<Referral> findByFranchiseIdOrderByNameAsc(UUID franchiseId);

    List<Referral> findByFranchiseIdAndActiveTrueOrderByNameAsc(UUID franchiseId);

    Optional<Referral> findByIdAndFranchiseId(UUID id, UUID franchiseId);
}
