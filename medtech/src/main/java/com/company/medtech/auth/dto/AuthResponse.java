package com.company.medtech.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String role;
    private String id;
    private String email;
    private String fullName;
    private String avatarUrl;
}
