package com.company.medtech.lab.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Owner-entered booking for a walk-in patient at the counter — no patient
 * account involved, always LAB_VISIT (the customer is physically present),
 * paid in cash and marked collected immediately. Exactly one of
 * testIds/packageId must be set — validated in LabTestBookingService,
 * same rule as LabTestBookingRequest.
 */
@Data
public class WalkInBookingRequest {

    @NotBlank
    private String customerName;

    private String customerPhone;

    /** Optional — if given, this booking (and its report once uploaded) becomes visible to whoever later logs in with this email. */
    @Email(message = "patientEmail must be a valid email address")
    private String patientEmail;

    private List<String> testIds;
    private String packageId;

    private String couponCode;

    /** How much the walk-in customer is paying right now. Null/0 = PENDING, less than the total = PARTIALLY_PAID, at/above = fully paid. */
    @DecimalMin(value = "0", message = "amountPaid cannot be negative")
    private BigDecimal amountPaid;

    /** Optional — the doctor or other person who referred this patient in. */
    private String referralId;

    /** Optional — lets the owner backdate a walk-in entered after the fact. Defaults to now if omitted. */
    private LocalDateTime createdAt;
}
