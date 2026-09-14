package com.company.medtech.franchise.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.franchise.dto.PaymentGatewayRequest;
import com.company.medtech.franchise.dto.PaymentGatewayResponse;
import com.company.medtech.franchise.service.PaymentGatewayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Each franchise brings its own Razorpay or PhonePe API key + secret. If
 * never configured (or later disabled), the franchise cannot accept online
 * payment — see BillingService#createOnlineOrder, which rejects online
 * orders for such a franchise and falls back to cash-at-counter only.
 */
@RestController
@RequestMapping(
        value = "/api/franchise/payment-gateway",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PaymentGatewayController {

    private final PaymentGatewayService paymentGatewayService;

    @GetMapping
    public ApiResponse<PaymentGatewayResponse> getStatus(Authentication authentication) {
        return ApiResponse.success("OK", paymentGatewayService.getStatus(authentication.getName()));
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<PaymentGatewayResponse> configure(
            Authentication authentication,
            @Valid @RequestBody PaymentGatewayRequest request
    ) {
        return ApiResponse.success(
                "Payment gateway configured",
                paymentGatewayService.configure(authentication.getName(), request)
        );
    }

    @DeleteMapping
    public ApiResponse<PaymentGatewayResponse> disable(Authentication authentication) {
        return ApiResponse.success(
                "Online payment disabled — cash only until reconfigured",
                paymentGatewayService.disable(authentication.getName())
        );
    }
}
