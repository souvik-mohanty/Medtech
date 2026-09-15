package com.company.medtech.consultation.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.consultation.dto.DoctorAppointmentResponse;
import com.company.medtech.consultation.dto.WalkInAppointmentRequest;
import com.company.medtech.consultation.service.DoctorAppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Franchise owner's view of doctor appointment bookings — who booked what, and payment status. */
@RestController
@RequestMapping(
        value = "/api/franchise/doctors/appointments",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class DoctorAppointmentController {

    private final DoctorAppointmentService doctorAppointmentService;

    @GetMapping
    public ApiResponse<List<DoctorAppointmentResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", doctorAppointmentService.listForOwner(authentication.getName()));
    }

    @PatchMapping("/{appointmentId}/mark-paid")
    public ApiResponse<DoctorAppointmentResponse> markPaid(Authentication authentication, @PathVariable String appointmentId) {
        return ApiResponse.success("Marked paid", doctorAppointmentService.markPaid(authentication.getName(), appointmentId));
    }

    @PostMapping(value = "/walk-in", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<DoctorAppointmentResponse> bookWalkIn(
            Authentication authentication,
            @Valid @RequestBody WalkInAppointmentRequest request
    ) {
        return ApiResponse.success("Appointment booked", doctorAppointmentService.bookWalkInAppointment(authentication.getName(), request));
    }

    @PatchMapping("/{appointmentId}/complete")
    public ApiResponse<DoctorAppointmentResponse> markCompleted(Authentication authentication, @PathVariable String appointmentId) {
        return ApiResponse.success("Consultation marked done", doctorAppointmentService.markCompleted(authentication.getName(), appointmentId));
    }
}
