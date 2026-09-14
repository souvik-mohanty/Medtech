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

/** The signed-in patient's own payment history. */
@RestController
@RequestMapping(
        value = "/api/patient/payments",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientPaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ApiResponse<List<PaymentResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", paymentService.listForPatient(authentication.getName()));
    }
}
