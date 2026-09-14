package com.company.medtech.config;

import com.company.medtech.auth.service.JwtService;
import com.company.medtech.common.constants.AppConstants;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the /api/franchise/** and /api/patient/** RBAC split actually
 * enforces both directions. Tokens are minted directly via JwtService,
 * bypassing Google — this is testing authorization, not the login flow.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Test
    void patientTokenIsRejectedFromFranchiseEndpoints() throws Exception {
        String token = tokenFor(AppConstants.ROLE_PATIENT);

        mockMvc.perform(get("/api/franchise/profile").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void franchiseTokenIsRejectedFromPatientEndpoints() throws Exception {
        String token = tokenFor(AppConstants.ROLE_FRANCHISE);

        mockMvc.perform(get("/api/patient/franchises/" + UUID.randomUUID() + "/products")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        // No custom AuthenticationEntryPoint is configured, so Spring
        // Security's default (Http403ForbiddenEntryPoint) applies — 403,
        // not 401, for a missing/invalid token. Pre-existing behavior,
        // unrelated to the role-model change; asserted here as a baseline.
        mockMvc.perform(get("/api/franchise/profile"))
                .andExpect(status().isForbidden());
    }

    private String tokenFor(String role) {
        return jwtService.generateToken("security-test-" + UUID.randomUUID() + "@example.com", role);
    }
}
