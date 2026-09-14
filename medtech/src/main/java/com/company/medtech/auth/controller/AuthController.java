package com.company.medtech.auth.controller;

import com.company.medtech.auth.dto.AuthResponse;
import com.company.medtech.auth.dto.GoogleLoginRequest;
import com.company.medtech.auth.service.GoogleOAuthService;
import com.company.medtech.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(
        value = "/api/auth",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class AuthController {

    private final GoogleOAuthService googleOAuthService;

    /**
     * Google Sign-In — the only login method for now. A first sign-in with no
     * existing account auto-provisions a Patient. Doctor / Lab Technician /
     * Delivery Partner accounts must also pass franchiseId, matched against
     * their pre-provisioned account.
     */
    @PostMapping(
            value = "/oauth/google",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ApiResponse<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = googleOAuthService.login(request.getIdToken(), request.getFranchiseId());
        return ApiResponse.success("Login successful", response);
    }
}
