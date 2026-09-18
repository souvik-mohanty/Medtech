package com.company.medtech.lab.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** What Razorpay's Checkout.js success handler hands back to the frontend, forwarded here to actually verify it — see RazorpayService#verifySignature. */
@Data
public class VerifyPaymentRequest {

    @NotBlank
    private String razorpayOrderId;

    @NotBlank
    private String razorpayPaymentId;

    @NotBlank
    private String razorpaySignature;
}
