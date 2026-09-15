package com.company.medtech.consultation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Owner-entered doctor appointment for a walk-in patient at the counter —
 * no patient account involved, always paid in cash. Mirrors
 * lab.dto.WalkInBookingRequest's shape and conventions.
 */
@Data
public class WalkInAppointmentRequest {

    @NotBlank
    private String scheduleId;

    @NotBlank
    private String customerName;

    @NotBlank
    private String mobileNumber;

    /** Optional — if given, this appointment becomes visible once the patient logs in with this email. */
    @Email(message = "patientEmail must be a valid email address")
    private String patientEmail;

    /** Mainly for REQUEST-type schedules ("please call to arrange") — optional either way. */
    private String note;

    /** Whether the fee was collected right now (PAID) or is still owed (PAYMENT_PENDING, confirmed later via mark-paid). */
    private boolean paidNow = true;

    /** Optional — lets the owner backdate a walk-in entered after the fact. Defaults to now if omitted. */
    private LocalDateTime createdAt;
}
