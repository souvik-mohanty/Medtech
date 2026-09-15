package com.company.medtech.lab.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.lab.dto.LabTestBookingRequest;
import com.company.medtech.lab.dto.LabTestBookingResponse;
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

import java.util.List;

/** A patient's own lab test bookings — booking, and viewing what they've booked. */
@RestController
@RequestMapping(
        value = "/api/patient/labtests/bookings",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientLabTestBookingController {

    private final LabTestBookingService labTestBookingService;
    private final LabReportService labReportService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<LabTestBookingResponse> book(
            Authentication authentication,
            @Valid @RequestBody LabTestBookingRequest request
    ) {
        return ApiResponse.success("Booking created", labTestBookingService.bookTest(authentication.getName(), request));
    }

    @GetMapping
    public ApiResponse<List<LabTestBookingResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", labTestBookingService.listForPatient(authentication.getName()));
    }

    @GetMapping("/{bookingId}")
    public ApiResponse<LabTestBookingResponse> get(Authentication authentication, @PathVariable String bookingId) {
        return ApiResponse.success("OK", labTestBookingService.getForPatient(authentication.getName(), bookingId));
    }

    @GetMapping("/{bookingId}/report")
    public ResponseEntity<byte[]> downloadReport(Authentication authentication, @PathVariable String bookingId) {
        LabReport report = labReportService.getForPatient(authentication.getName(), bookingId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(report.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + report.getFileName() + "\"")
                .body(report.getFileData());
    }

    @GetMapping("/{bookingId}/invoice")
    public ResponseEntity<byte[]> downloadInvoice(Authentication authentication, @PathVariable String bookingId) {
        byte[] pdf = labTestBookingService.renderInvoicePdfForPatient(authentication.getName(), bookingId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"invoice-" + bookingId + ".pdf\"")
                .body(pdf);
    }
}
