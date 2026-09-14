package com.company.medtech.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {

    @NotBlank
    private String idToken;

    /** Required only for franchise-scoped staff roles (lab technician, delivery partner). */
    private String franchiseId;
}
