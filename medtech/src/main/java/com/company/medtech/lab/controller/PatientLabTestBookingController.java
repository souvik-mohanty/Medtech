package com.company.medtech.lab.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.lab.dto.LabTestBookingRequest;
import com.company.medtech.lab.dto.LabTestBookingResponse;
import com.company.medtech.lab.service.LabTestBookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** A patient booking a lab test or combo — requires address and mobile number. */
@RestController
@RequestMapping(
        value = "/api/patient/labtests/bookings",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientLabTestBookingController {

    private final LabTestBookingService labTestBookingService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<LabTestBookingResponse> book(
            Authentication authentication,
            @Valid @RequestBody LabTestBookingRequest request
    ) {
        return ApiResponse.success("Booking created", labTestBookingService.bookTest(authentication.getName(), request));
    }
}
