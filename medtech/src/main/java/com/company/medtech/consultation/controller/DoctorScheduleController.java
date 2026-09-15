package com.company.medtech.consultation.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.consultation.dto.DoctorScheduleRequest;
import com.company.medtech.consultation.dto.DoctorScheduleResponse;
import com.company.medtech.consultation.service.DoctorScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Franchise owner's doctor visiting-window schedules. */
@RestController
@RequestMapping(
        value = "/api/franchise/doctors/schedules",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class DoctorScheduleController {

    private final DoctorScheduleService doctorScheduleService;

    @GetMapping
    public ApiResponse<List<DoctorScheduleResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", doctorScheduleService.listForOwner(authentication.getName()));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<DoctorScheduleResponse> create(
            Authentication authentication,
            @Valid @RequestBody DoctorScheduleRequest request
    ) {
        return ApiResponse.success("Schedule added", doctorScheduleService.create(authentication.getName(), request));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<DoctorScheduleResponse> update(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody DoctorScheduleRequest request
    ) {
        return ApiResponse.success("Schedule updated", doctorScheduleService.update(authentication.getName(), id, request));
    }

    @PatchMapping("/{id}/toggle-active")
    public ApiResponse<DoctorScheduleResponse> toggleActive(Authentication authentication, @PathVariable String id) {
        return ApiResponse.success("Schedule updated", doctorScheduleService.toggleActive(authentication.getName(), id));
    }
}
