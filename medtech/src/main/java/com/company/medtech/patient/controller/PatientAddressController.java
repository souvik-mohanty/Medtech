package com.company.medtech.patient.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.patient.dto.AddressRequest;
import com.company.medtech.patient.dto.PatientProfileResponse;
import com.company.medtech.patient.service.PatientProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(
        value = "/api/patient/addresses",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientAddressController {

    private final PatientProfileService profileService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<PatientProfileResponse> addAddress(
            Authentication authentication,
            @Valid @RequestBody AddressRequest request
    ) {
        return ApiResponse.success("Address added", profileService.addAddress(authentication.getName(), request));
    }
}
