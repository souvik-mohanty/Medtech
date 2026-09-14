package com.company.medtech.auth.service;

import com.company.medtech.auth.dto.AuthResponse;
import com.company.medtech.auth.model.UserAuth;
import com.company.medtech.auth.repository.UserAuthRepository;
import com.company.medtech.common.constants.AppConstants;
import com.company.medtech.common.exceptions.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

/**
 * Google Sign-In is currently the only login method for every role. A first
 * sign-in with no existing account auto-provisions a PATIENT; every other
 * role (Admin, Customer Support, Franchise Owner, Doctor, Lab Technician,
 * Delivery Partner) must be pre-provisioned by an admin.
 */
@Service
public class GoogleOAuthService {

    private static final String TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final UserAuthRepository userRepo;
    private final JwtService jwtService;
    private final RestTemplate restTemplate;

    @Value("${google.oauth.client-id}")
    private String googleClientId;

    public GoogleOAuthService(UserAuthRepository userRepo, JwtService jwtService, RestTemplateBuilder restTemplateBuilder) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.restTemplate = restTemplateBuilder.build();
    }

    public AuthResponse login(String idToken, String franchiseId) {
        Map<String, Object> payload = verifyIdToken(idToken);

        Object emailVerifiedClaim = payload.get("email_verified");
        boolean emailVerified = "true".equals(String.valueOf(emailVerifiedClaim));
        String email = (String) payload.get("email");

        if (email == null || !emailVerified) {
            throw new BusinessException("Google account email is not verified");
        }

        UserAuth user = userRepo.findByEmail(email)
                .orElseGet(() -> registerPatient(email));

        if (!user.isActive()) {
            throw new BusinessException("User is inactive");
        }

        validateFranchiseScope(user, franchiseId);

        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, user.getRole());
    }

    /**
     * Doctor / lab technician / delivery partner accounts are scoped to one
     * franchise (clinic/store): signing in is not enough, the franchise ID
     * must be supplied and match the franchise their account is assigned to.
     */
    private void validateFranchiseScope(UserAuth user, String franchiseId) {
        if (!AppConstants.FRANCHISE_SCOPED_ROLES.contains(user.getRole())) {
            return;
        }

        if (franchiseId == null || franchiseId.isBlank()) {
            throw new BusinessException("Franchise ID is required for this account type");
        }

        UUID parsedFranchiseId;
        try {
            parsedFranchiseId = UUID.fromString(franchiseId);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Franchise ID does not match your assigned franchise");
        }

        if (!parsedFranchiseId.equals(user.getFranchiseId())) {
            throw new BusinessException("Franchise ID does not match your assigned franchise");
        }
    }

    private UserAuth registerPatient(String email) {
        UserAuth user = new UserAuth();
        user.setEmail(email);
        user.setRole(AppConstants.ROLE_PATIENT);
        user.setActive(true);
        return userRepo.save(user);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> verifyIdToken(String idToken) {
        Map<String, Object> payload;
        try {
            payload = restTemplate.getForObject(TOKENINFO_URL + idToken, Map.class);
        } catch (RestClientException e) {
            throw new BusinessException("Invalid Google token");
        }

        if (payload == null || !googleClientId.equals(payload.get("aud"))) {
            throw new BusinessException("Invalid Google token");
        }

        return payload;
    }
}
