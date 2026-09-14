package com.company.medtech.billing.controller;

import com.company.medtech.billing.dto.BillResponse;
import com.company.medtech.billing.dto.CreateCounterBillRequest;
import com.company.medtech.billing.service.BillingService;
import com.company.medtech.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Counter/walk-in billing: staff pick products from inventory, bill is paid cash and printed. */
@RestController
@RequestMapping(
        value = "/api/franchise/billing",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class FranchiseBillingController {

    private final BillingService billingService;

    @PostMapping(value = "/bills", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<BillResponse> createCounterBill(
            Authentication authentication,
            @Valid @RequestBody CreateCounterBillRequest request
    ) {
        return ApiResponse.success("Bill created", billingService.createCounterBill(authentication.getName(), request));
    }

    @GetMapping("/bills")
    public ApiResponse<List<BillResponse>> listBills(Authentication authentication) {
        return ApiResponse.success("OK", billingService.listForOwner(authentication.getName()));
    }

    /** Returns the invoice PDF for printing/download. */
    @GetMapping("/bills/{billId}/invoice")
    public ResponseEntity<byte[]> downloadInvoice(Authentication authentication, @PathVariable String billId) {
        byte[] pdf = billingService.renderInvoicePdf(authentication.getName(), billId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"invoice-" + billId + ".pdf\"")
                .body(pdf);
    }
}
