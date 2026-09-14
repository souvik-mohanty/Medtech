package com.company.medtech.franchise.service;

import com.company.medtech.auth.model.UserAuth;
import com.company.medtech.auth.repository.UserAuthRepository;
import com.company.medtech.common.constants.AppConstants;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.franchise.dto.AdminFranchiseRequest;
import com.company.medtech.franchise.dto.AdminFranchiseResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class AdminFranchiseServiceTest {

    @Autowired
    private AdminFranchiseService adminFranchiseService;

    @Autowired
    private FranchiseService franchiseService;

    @Autowired
    private UserAuthRepository userAuthRepository;

    @Test
    void onboardingCreatesAFreshOwnerAccountWhenNoneExists() {
        String email = uniqueEmail();

        AdminFranchiseResponse response = adminFranchiseService.create(request(email, "Brand New Pharmacy"));

        assertThat(response.isActive()).isTrue();
        UserAuth owner = userAuthRepository.findByEmail(email).orElseThrow();
        assertThat(owner.getRole()).isEqualTo(AppConstants.ROLE_FRANCHISE);
    }

    @Test
    void onboardingPromotesAnExistingPatientAccountToFranchise() {
        String email = uniqueEmail();
        UserAuth patient = new UserAuth();
        patient.setEmail(email);
        patient.setRole(AppConstants.ROLE_PATIENT);
        patient.setActive(true);
        userAuthRepository.save(patient);

        adminFranchiseService.create(request(email, "Promoted Pharmacy"));

        UserAuth promoted = userAuthRepository.findByEmail(email).orElseThrow();
        assertThat(promoted.getRole()).isEqualTo(AppConstants.ROLE_FRANCHISE);
    }

    @Test
    void onboardingRefusesAnEmailAlreadyBelongingToAnotherRole() {
        String email = uniqueEmail();
        UserAuth doctor = new UserAuth();
        doctor.setEmail(email);
        doctor.setRole(AppConstants.ROLE_DOCTOR);
        doctor.setActive(true);
        userAuthRepository.save(doctor);

        assertThatThrownBy(() -> adminFranchiseService.create(request(email, "Should Not Onboard")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already registered as DOCTOR");

        // The doctor account itself must be untouched.
        assertThat(userAuthRepository.findByEmail(email).orElseThrow().getRole()).isEqualTo(AppConstants.ROLE_DOCTOR);
    }

    @Test
    void onboardingRefusesADuplicateOwnerEmail() {
        String email = uniqueEmail();
        adminFranchiseService.create(request(email, "First Franchise"));

        assertThatThrownBy(() -> adminFranchiseService.create(request(email, "Second Franchise")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already linked");
    }

    @Test
    void suspendedFranchiseCannotBeAccessedByItsOwner() {
        String email = uniqueEmail();
        AdminFranchiseResponse created = adminFranchiseService.create(request(email, "Suspend Me Pharmacy"));

        adminFranchiseService.setActive(created.getId(), false);

        assertThatThrownBy(() -> franchiseService.getByOwnerEmail(email))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("suspended");
    }

    @Test
    void reactivatingRestoresOwnerAccess() {
        String email = uniqueEmail();
        AdminFranchiseResponse created = adminFranchiseService.create(request(email, "Reactivate Me Pharmacy"));
        adminFranchiseService.setActive(created.getId(), false);

        adminFranchiseService.setActive(created.getId(), true);

        assertThat(franchiseService.getByOwnerEmail(email)).isNotNull();
    }

    private AdminFranchiseRequest request(String ownerEmail, String name) {
        AdminFranchiseRequest request = new AdminFranchiseRequest();
        request.setOwnerEmail(ownerEmail);
        request.setName(name);
        return request;
    }

    private String uniqueEmail() {
        return "owner-" + UUID.randomUUID() + "@example.com";
    }
}
