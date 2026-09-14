package com.company.medtech.payment.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.payment.dto.PaymentResponse;
import com.company.medtech.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Every transaction across the franchise owner's lab. */
@RestController
@RequestMapping(
        value = "/api/franchise/payments",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class FranchisePaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ApiResponse<List<PaymentResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", paymentService.listForOwner(authentication.getName()));
    }
}
