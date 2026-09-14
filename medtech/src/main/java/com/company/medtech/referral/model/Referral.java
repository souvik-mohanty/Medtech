package com.company.medtech.referral.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A doctor or anyone else who refers patients to the lab, with their own
 * commission rate. Selected on walk-in bookings only (see
 * LabTestBookingService#createWalkInBooking), which snapshot name/
 * commission at booking time rather than referencing this row live.
 */
@Entity
@Table(name = "referral")
public class Referral {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "franchise_id", nullable = false)
    private UUID franchiseId;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReferralType type = ReferralType.OTHER;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "commission_type", nullable = false)
    private CommissionType commissionType = CommissionType.PERCENTAGE;

    @Column(name = "commission_value", nullable = false)
    private BigDecimal commissionValue = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /** How much commission has actually been paid out so far — total earned is always computed live, see ReferralService#toResponse. */
    @Column(name = "settled_amount", nullable = false)
    private BigDecimal settledAmount = BigDecimal.ZERO;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getFranchiseId() {
        return franchiseId;
    }

    public void setFranchiseId(UUID franchiseId) {
        this.franchiseId = franchiseId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ReferralType getType() {
        return type;
    }

    public void setType(ReferralType type) {
        this.type = type;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public CommissionType getCommissionType() {
        return commissionType;
    }

    public void setCommissionType(CommissionType commissionType) {
        this.commissionType = commissionType;
    }

    public BigDecimal getCommissionValue() {
        return commissionValue;
    }

    public void setCommissionValue(BigDecimal commissionValue) {
        this.commissionValue = commissionValue;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public BigDecimal getSettledAmount() {
        return settledAmount;
    }

    public void setSettledAmount(BigDecimal settledAmount) {
        this.settledAmount = settledAmount;
    }
}
