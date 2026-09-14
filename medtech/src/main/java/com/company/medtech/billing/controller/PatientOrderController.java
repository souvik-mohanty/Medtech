package com.company.medtech.billing.controller;

import com.company.medtech.billing.dto.BillResponse;
import com.company.medtech.billing.dto.CreateOnlineOrderRequest;
import com.company.medtech.billing.service.BillingService;
import com.company.medtech.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * A patient's online medicine order. Creates a PAYMENT_PENDING bill only —
 * there is no payment gateway wired up yet (see BillingService), so this
 * alone does not complete a purchase.
 */
@RestController
@RequestMapping(
        value = "/api/patient/orders",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientOrderController {

    private final BillingService billingService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<BillResponse> createOrder(
            Authentication authentication,
            @Valid @RequestBody CreateOnlineOrderRequest request
    ) {
        return ApiResponse.success(
                "Order created, awaiting payment",
                billingService.createOnlineOrder(authentication.getName(), request)
        );
    }
}
