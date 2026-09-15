package com.company.medtech.lab.repository;

import com.company.medtech.lab.model.LabTestBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LabTestBookingRepository extends JpaRepository<LabTestBooking, UUID> {

    List<LabTestBooking> findByFranchiseIdOrderByCreatedAtDesc(UUID franchiseId);

    Optional<LabTestBooking> findByIdAndFranchiseId(UUID id, UUID franchiseId);

    List<LabTestBooking> findByPatientEmailOrderByCreatedAtDesc(String patientEmail);

    Optional<LabTestBooking> findByIdAndPatientEmail(UUID id, String patientEmail);

    /** Total commission this referral has earned from walk-in lab bookings — see ReferralService#toResponse. */
    @Query("select coalesce(sum(b.referralCommission), 0) from LabTestBooking b where b.referralId = :referralId")
    BigDecimal sumCommissionByReferralId(@Param("referralId") UUID referralId);

    /** Blocks a LabTestCombo delete once it has real booking history — see LabTestService#deleteCombo. */
    boolean existsByPackageId(UUID packageId);
}
