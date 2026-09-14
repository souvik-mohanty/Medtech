package com.company.medtech.franchise.service;

import com.company.medtech.auth.model.UserAuth;
import com.company.medtech.auth.repository.UserAuthRepository;
import com.company.medtech.auth.service.JwtService;
import com.company.medtech.common.constants.AppConstants;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.franchise.dto.FranchiseOnboardRequest;
import com.company.medtech.franchise.dto.FranchiseOnboardResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class FranchiseOnboardingServiceTest {

    @Autowired
    private FranchiseService franchiseService;

    @Autowired
    private UserAuthRepository userAuthRepository;

    @Autowired
    private JwtService jwtService;

    @Test
    void patientOnboardingBecomesAFranchiseOwner() {
        String email = registerPatient();

        FranchiseOnboardResponse response = franchiseService.onboard(email, request("Brand New Pharmacy"));

        UserAuth owner = userAuthRepository.findByEmail(email).orElseThrow();
        assertThat(owner.getRole()).isEqualTo(AppConstants.ROLE_FRANCHISE);
        assertThat(response.getRole()).isEqualTo(AppConstants.ROLE_FRANCHISE);
        assertThat(jwtService.extractEmail(response.getToken())).isEqualTo(email);
        assertThat(jwtService.extractRole(response.getToken())).isEqualTo(AppConstants.ROLE_FRANCHISE);
    }

    @Test
    void onboardingTwiceIsRefused() {
        String email = registerPatient();
        franchiseService.onboard(email, request("First Pharmacy"));

        assertThatThrownBy(() -> franchiseService.onboard(email, request("Second Pharmacy")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already have a franchise");
    }

    @Test
    void listActiveIncludesAFreshlyOnboardedFranchise() {
        String email = registerPatient();
        franchiseService.onboard(email, request("Discoverable Pharmacy"));

        assertThat(franchiseService.listActive())
                .extracting("name")
                .contains("Discoverable Pharmacy");
    }

    private String registerPatient() {
        String email = "patient-" + UUID.randomUUID() + "@example.com";
        UserAuth patient = new UserAuth();
        patient.setEmail(email);
        patient.setRole(AppConstants.ROLE_PATIENT);
        patient.setActive(true);
        userAuthRepository.save(patient);
        return email;
    }

    private FranchiseOnboardRequest request(String name) {
        FranchiseOnboardRequest request = new FranchiseOnboardRequest();
        request.setName(name);
        return request;
    }
}
