package com.company.medtech.patient.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.patient.dto.PatientProfileResponse;
import com.company.medtech.patient.dto.PatientProfileUpdateRequest;
import com.company.medtech.patient.service.PatientProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * The signed-in patient's own profile — resolved from the authenticated
 * caller's email, same convention as FranchiseController.
 */
@RestController
@RequestMapping(
        value = "/api/patient/profile",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientProfileController {

    private final PatientProfileService profileService;

    @GetMapping
    public ApiResponse<PatientProfileResponse> getProfile(Authentication authentication) {
        return ApiResponse.success("OK", profileService.getProfile(authentication.getName()));
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<PatientProfileResponse> updateProfile(
            Authentication authentication,
            @Valid @RequestBody PatientProfileUpdateRequest request
    ) {
        return ApiResponse.success("Profile updated", profileService.updateProfile(authentication.getName(), request));
    }
}
