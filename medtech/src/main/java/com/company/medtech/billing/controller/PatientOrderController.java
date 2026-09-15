package com.company.medtech.billing.controller;

import com.company.medtech.billing.dto.BillResponse;
import com.company.medtech.billing.dto.CreateOnlineOrderRequest;
import com.company.medtech.billing.service.BillingService;
import com.company.medtech.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** A patient's own medicine/equipment orders — placing one, and viewing order history. */
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
        return ApiResponse.success("Order placed", billingService.createOnlineOrder(authentication.getName(), request));
    }

    @GetMapping
    public ApiResponse<List<BillResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", billingService.listForPatient(authentication.getName()));
    }

    /** Returns the invoice PDF for printing/download. */
    @GetMapping("/{billId}/invoice")
    public ResponseEntity<byte[]> downloadInvoice(Authentication authentication, @PathVariable String billId) {
        byte[] pdf = billingService.renderInvoicePdfForPatient(authentication.getName(), billId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"invoice-" + billId + ".pdf\"")
                .body(pdf);
    }
}
