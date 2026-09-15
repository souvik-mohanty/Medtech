package com.company.medtech.coupon.repository;

import com.company.medtech.coupon.model.Coupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CouponRepository extends JpaRepository<Coupon, UUID> {

    List<Coupon> findByFranchiseIdOrderByCreatedAtDesc(UUID franchiseId);

    Optional<Coupon> findByIdAndFranchiseId(UUID id, UUID franchiseId);

    Optional<Coupon> findByFranchiseIdAndCodeIgnoreCase(UUID franchiseId, String code);

    /** Row-locks the coupon for the rest of the transaction so two concurrent redemptions can't both slip past a usage-limit check. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Coupon c where c.franchiseId = :franchiseId and upper(c.code) = upper(:code)")
    Optional<Coupon> findByFranchiseIdAndCodeIgnoreCaseForUpdate(UUID franchiseId, String code);
}
