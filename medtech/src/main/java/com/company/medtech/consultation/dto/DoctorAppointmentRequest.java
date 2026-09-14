package com.company.medtech.consultation.dto;

import com.company.medtech.billing.model.PaymentMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DoctorAppointmentRequest {

    @NotBlank
    private String scheduleId;

    @NotBlank
    private String mobileNumber;

    /** Mainly for REQUEST-type schedules ("please call to arrange") — optional either way. */
    private String note;

    @NotNull
    private PaymentMode paymentMode;
}
