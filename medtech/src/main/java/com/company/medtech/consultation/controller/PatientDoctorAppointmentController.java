package com.company.medtech.consultation.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.consultation.dto.DoctorAppointmentRequest;
import com.company.medtech.consultation.dto.DoctorAppointmentResponse;
import com.company.medtech.consultation.service.DoctorAppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** A patient booking a doctor appointment — mobile number required. */
@RestController
@RequestMapping(
        value = "/api/patient/doctors/appointments",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientDoctorAppointmentController {

    private final DoctorAppointmentService doctorAppointmentService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<DoctorAppointmentResponse> book(
            Authentication authentication,
            @Valid @RequestBody DoctorAppointmentRequest request
    ) {
        return ApiResponse.success("Appointment booked", doctorAppointmentService.bookAppointment(authentication.getName(), request));
    }
}
