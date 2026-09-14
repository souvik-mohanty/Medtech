package com.company.medtech.patient.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.patient.dto.FamilyMemberRequest;
import com.company.medtech.patient.dto.PatientProfileResponse;
import com.company.medtech.patient.service.PatientProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(
        value = "/api/patient/family-members",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class FamilyMemberController {

    private final PatientProfileService profileService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<PatientProfileResponse> addFamilyMember(
            Authentication authentication,
            @Valid @RequestBody FamilyMemberRequest request
    ) {
        return ApiResponse.success("Family member added", profileService.addFamilyMember(authentication.getName(), request));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<PatientProfileResponse> updateFamilyMember(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody FamilyMemberRequest request
    ) {
        return ApiResponse.success("Family member updated", profileService.updateFamilyMember(authentication.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<PatientProfileResponse> deleteFamilyMember(Authentication authentication, @PathVariable UUID id) {
        return ApiResponse.success("Family member removed", profileService.deleteFamilyMember(authentication.getName(), id));
    }
}
