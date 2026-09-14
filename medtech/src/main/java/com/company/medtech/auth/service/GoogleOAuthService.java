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

/**
 * Google Sign-In is the only login method. A first sign-in with no existing
 * account auto-provisions a PATIENT; the only other role, FRANCHISE (shop
 * owner), is reached by a PATIENT self-onboarding via
 * FranchiseService#onboard — never pre-provisioned.
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

    public AuthResponse login(String idToken) {
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

        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, user.getRole());
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
