package com.company.medtech.franchise.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.franchise.dto.FranchiseBrandingRequest;
import com.company.medtech.franchise.dto.FranchiseResponse;
import com.company.medtech.franchise.service.FranchiseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * The franchise owner's own profile and invoice branding — logo, accent
 * color, font, footer note (see docs/PROJECT_SPEC.md billing section). The
 * franchise is resolved from the authenticated caller's email, not a path
 * variable, so an owner can only ever see/edit their own franchise.
 */
@RestController
@RequestMapping(
        value = "/api/franchise/profile",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class FranchiseController {

    private final FranchiseService franchiseService;

    @GetMapping
    public ApiResponse<FranchiseResponse> getProfile(Authentication authentication) {
        return ApiResponse.success("OK", franchiseService.getProfile(authentication.getName()));
    }

    @PutMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<FranchiseResponse> updateBranding(
            Authentication authentication,
            @Valid @RequestBody FranchiseBrandingRequest request
    ) {
        return ApiResponse.success("Branding updated", franchiseService.updateBranding(authentication.getName(), request));
    }
}
