package com.company.medtech.franchise.dto;

import com.company.medtech.franchise.model.PaymentProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentGatewayRequest {

    @NotNull
    private PaymentProvider provider;

    /** Razorpay: Key ID. PhonePe: Merchant ID. */
    @NotBlank
    private String apiKey;

    /** Razorpay: Key Secret. PhonePe: Salt Key. Encrypted before storage, never echoed back. */
    @NotBlank
    private String apiSecret;
}
