package com.company.medtech.consultation.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.consultation.dto.DoctorScheduleResponse;
import com.company.medtech.consultation.service.DoctorScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** A patient browsing a franchise's upcoming doctor visiting windows. */
@RestController
@RequestMapping(
        value = "/api/patient/franchises/{franchiseId}/doctors/schedules",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientDoctorScheduleController {

    private final DoctorScheduleService doctorScheduleService;

    @GetMapping
    public ApiResponse<List<DoctorScheduleResponse>> list(@PathVariable String franchiseId) {
        return ApiResponse.success("OK", doctorScheduleService.listForFranchise(franchiseId));
    }
}
