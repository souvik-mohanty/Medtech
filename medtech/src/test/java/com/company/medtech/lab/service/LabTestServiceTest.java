package com.company.medtech.lab.service;

import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import com.company.medtech.lab.dto.LabTestComboRequest;
import com.company.medtech.lab.dto.LabTestComboResponse;
import com.company.medtech.lab.dto.LabTestRequest;
import com.company.medtech.lab.dto.LabTestResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class LabTestServiceTest {

    @Autowired
    private LabTestService labTestService;

    @Autowired
    private FranchiseRepository franchiseRepository;

    private Franchise franchise;
    private Franchise otherFranchise;

    @BeforeEach
    void setUp() {
        franchise = franchiseRepository.save(newFranchise());
        otherFranchise = franchiseRepository.save(newFranchise());
    }

    @Test
    void createsAComboFromTheCallersOwnTests() {
        LabTestResponse cbc = labTestService.createTest(franchise.getOwnerEmail(), testRequest("CBC", "300.00"));
        LabTestResponse sugar = labTestService.createTest(franchise.getOwnerEmail(), testRequest("Blood Sugar", "150.00"));

        LabTestComboRequest comboRequest = new LabTestComboRequest();
        comboRequest.setName("Basic Health Checkup");
        comboRequest.setComboPrice(new BigDecimal("400.00"));
        comboRequest.setTestIds(List.of(cbc.getId(), sugar.getId()));

        LabTestComboResponse combo = labTestService.createCombo(franchise.getOwnerEmail(), comboRequest);

        assertThat(combo.getTests()).extracting("name").containsExactlyInAnyOrder("CBC", "Blood Sugar");
        assertThat(labTestService.listCombos(franchise.getOwnerEmail())).hasSize(1);
    }

    @Test
    void refusesAComboReferencingAnotherFranchisesTest() {
        LabTestResponse foreignTest = labTestService.createTest(otherFranchise.getOwnerEmail(), testRequest("MRI", "5000.00"));

        LabTestComboRequest comboRequest = new LabTestComboRequest();
        comboRequest.setName("Sneaky Combo");
        comboRequest.setComboPrice(new BigDecimal("100.00"));
        comboRequest.setTestIds(List.of(foreignTest.getId()));

        assertThatThrownBy(() -> labTestService.createCombo(franchise.getOwnerEmail(), comboRequest))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private LabTestRequest testRequest(String name, String price) {
        LabTestRequest request = new LabTestRequest();
        request.setName(name);
        request.setPrice(new BigDecimal(price));
        return request;
    }

    private Franchise newFranchise() {
        Franchise f = new Franchise();
        f.setOwnerEmail("owner-" + UUID.randomUUID() + "@example.com");
        f.setName("Test Pharmacy");
        return f;
    }
}
