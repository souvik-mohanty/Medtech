package com.company.medtech.lab.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.lab.dto.LabTestBookingResponse;
import com.company.medtech.lab.service.LabTestBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Franchise owner's view of lab test bookings — who booked what, and payment status. */
@RestController
@RequestMapping(
        value = "/api/franchise/labtests/bookings",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class LabTestBookingController {

    private final LabTestBookingService labTestBookingService;

    @GetMapping
    public ApiResponse<List<LabTestBookingResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", labTestBookingService.listForOwner(authentication.getName()));
    }

    @PatchMapping("/{bookingId}/mark-paid")
    public ApiResponse<LabTestBookingResponse> markPaid(Authentication authentication, @PathVariable String bookingId) {
        return ApiResponse.success("Marked paid", labTestBookingService.markPaid(authentication.getName(), bookingId));
    }
}
