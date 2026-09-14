package com.company.medtech.franchise.service;

import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Franchise rows are provisioned directly in Postgres (see CLAUDE.md) — no
 * self-service or admin onboarding endpoint exists, so these tests create
 * franchises straight through the repository, same as BillingServiceTest.
 */
@SpringBootTest
@ActiveProfiles("test")
class FranchiseServiceTest {

    @Autowired
    private FranchiseService franchiseService;

    @Autowired
    private FranchiseRepository franchiseRepository;

    @Test
    void getByOwnerEmailReturnsTheLinkedFranchise() {
        Franchise franchise = franchiseRepository.save(newFranchise("Owner's Pharmacy"));

        assertThat(franchiseService.getByOwnerEmail(franchise.getOwnerEmail()).getId()).isEqualTo(franchise.getId());
    }

    @Test
    void getByOwnerEmailRefusesAnUnlinkedAccount() {
        String email = "unlinked-" + UUID.randomUUID() + "@example.com";

        assertThatThrownBy(() -> franchiseService.getByOwnerEmail(email))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No franchise is linked");
    }

    @Test
    void getByOwnerEmailRefusesASuspendedFranchise() {
        Franchise franchise = newFranchise("Suspended Pharmacy");
        franchise.setActive(false);
        franchiseRepository.save(franchise);

        assertThatThrownBy(() -> franchiseService.getByOwnerEmail(franchise.getOwnerEmail()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("suspended");
    }

    @Test
    void listActiveIncludesActiveFranchisesOnly() {
        Franchise active = franchiseRepository.save(newFranchise("Active Pharmacy"));
        Franchise inactive = newFranchise("Inactive Pharmacy");
        inactive.setActive(false);
        franchiseRepository.save(inactive);

        assertThat(franchiseService.listActive())
                .extracting("name")
                .contains(active.getName())
                .doesNotContain(inactive.getName());
    }

    private Franchise newFranchise(String name) {
        Franchise franchise = new Franchise();
        franchise.setOwnerEmail("owner-" + UUID.randomUUID() + "@example.com");
        franchise.setName(name);
        franchise.setActive(true);
        return franchise;
    }
}
