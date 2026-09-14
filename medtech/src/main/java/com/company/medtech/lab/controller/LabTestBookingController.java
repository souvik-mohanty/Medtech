package com.company.medtech.lab.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.lab.dto.CollectionStatusUpdateRequest;
import com.company.medtech.lab.dto.LabTestBookingResponse;
import com.company.medtech.lab.dto.RecordPaymentRequest;
import com.company.medtech.lab.dto.WalkInBookingRequest;
import com.company.medtech.lab.model.LabReport;
import com.company.medtech.lab.service.LabReportService;
import com.company.medtech.lab.service.LabTestBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Franchise owner's view of lab test bookings — who booked what, and payment/collection status. */
@RestController
@RequestMapping(
        value = "/api/franchise/labtests/bookings",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class LabTestBookingController {

    private final LabTestBookingService labTestBookingService;
    private final LabReportService labReportService;

    @GetMapping
    public ApiResponse<List<LabTestBookingResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", labTestBookingService.listForOwner(authentication.getName()));
    }

    @PostMapping(value = "/walk-in", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<LabTestBookingResponse> createWalkIn(
            Authentication authentication,
            @Valid @RequestBody WalkInBookingRequest request
    ) {
        return ApiResponse.success(
                "Walk-in booking created",
                labTestBookingService.createWalkInBooking(authentication.getName(), request)
        );
    }

    @PatchMapping("/{bookingId}/mark-paid")
    public ApiResponse<LabTestBookingResponse> markPaid(Authentication authentication, @PathVariable String bookingId) {
        return ApiResponse.success("Marked paid", labTestBookingService.markPaid(authentication.getName(), bookingId));
    }

    @PatchMapping(value = "/{bookingId}/record-payment", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<LabTestBookingResponse> recordPayment(
            Authentication authentication,
            @PathVariable String bookingId,
            @Valid @RequestBody RecordPaymentRequest request
    ) {
        return ApiResponse.success(
                "Payment recorded",
                labTestBookingService.recordPayment(authentication.getName(), bookingId, request.getAmount())
        );
    }

    @PostMapping(value = "/{bookingId}/report", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Void> uploadReport(
            Authentication authentication,
            @PathVariable String bookingId,
            @RequestParam("file") MultipartFile file
    ) {
        labReportService.upload(authentication.getName(), bookingId, file);
        return ApiResponse.success("Report uploaded", null);
    }

    @GetMapping("/{bookingId}/report")
    public ResponseEntity<byte[]> downloadReport(Authentication authentication, @PathVariable String bookingId) {
        LabReport report = labReportService.getForOwner(authentication.getName(), bookingId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(report.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + report.getFileName() + "\"")
                .body(report.getFileData());
    }

    @PatchMapping(value = "/{bookingId}/collection-status", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<LabTestBookingResponse> updateCollectionStatus(
            Authentication authentication,
            @PathVariable String bookingId,
            @Valid @RequestBody CollectionStatusUpdateRequest request
    ) {
        return ApiResponse.success(
                "Collection status updated",
                labTestBookingService.updateCollectionStatus(authentication.getName(), bookingId, request.getCollectionStatus())
        );
    }

    @PatchMapping("/{bookingId}/cancel")
    public ApiResponse<LabTestBookingResponse> cancel(Authentication authentication, @PathVariable String bookingId) {
        return ApiResponse.success("Booking cancelled", labTestBookingService.cancelBooking(authentication.getName(), bookingId));
    }
}
