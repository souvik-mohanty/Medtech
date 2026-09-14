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
     * Google Sign-In — the only login method. A first sign-in with no
     * existing account auto-provisions a Patient.
     */
    @PostMapping(
            value = "/oauth/google",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ApiResponse<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = googleOAuthService.login(request.getIdToken());
        return ApiResponse.success("Login successful", response);
    }
}
