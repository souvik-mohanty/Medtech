package com.company.medtech.billing.repository;

import com.company.medtech.billing.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillRepository extends JpaRepository<Bill, UUID> {

    List<Bill> findByFranchiseIdOrderByCreatedAtDesc(UUID franchiseId);

    List<Bill> findByPatientEmailOrderByCreatedAtDesc(String patientEmail);

    Optional<Bill> findByIdAndFranchiseId(UUID id, UUID franchiseId);

    /** Total commission this referral has earned from walk-in medicine bills — see ReferralService#toResponse. */
    @Query("select coalesce(sum(b.referralCommission), 0) from Bill b where b.referralId = :referralId")
    BigDecimal sumCommissionByReferralId(@Param("referralId") UUID referralId);
}
