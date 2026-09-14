package com.company.medtech.lab.dto;

import com.company.medtech.billing.model.PaymentMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Exactly one of labTestId/comboId must be set — validated in LabTestBookingService. */
@Data
public class LabTestBookingRequest {

    @NotBlank
    private String franchiseId;

    private String labTestId;
    private String comboId;

    @NotBlank
    private String address;

    @NotBlank
    private String mobileNumber;

    @NotNull
    private PaymentMode paymentMode;
}
