package com.company.medtech.franchise.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.franchise.dto.FranchiseOnboardRequest;
import com.company.medtech.franchise.dto.FranchiseOnboardResponse;
import com.company.medtech.franchise.service.FranchiseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Self-service franchise creation — with no admin to provision one, this is
 * the only way a Patient becomes a shop owner. Reachable by PATIENT and
 * FRANCHISE (see SecurityConfig's dedicated matcher for this exact path).
 */
@RestController
@RequestMapping(
        value = "/api/franchise/onboard",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class FranchiseOnboardingController {

    private final FranchiseService franchiseService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<FranchiseOnboardResponse> onboard(
            Authentication authentication,
            @Valid @RequestBody FranchiseOnboardRequest request
    ) {
        return ApiResponse.success("Franchise created", franchiseService.onboard(authentication.getName(), request));
    }
}
