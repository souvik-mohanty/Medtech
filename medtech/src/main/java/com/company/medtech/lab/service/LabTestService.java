package com.company.medtech.lab.service;

import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.lab.dto.LabTestComboRequest;
import com.company.medtech.lab.dto.LabTestComboResponse;
import com.company.medtech.lab.dto.LabTestRequest;
import com.company.medtech.lab.dto.LabTestResponse;
import com.company.medtech.lab.model.LabTest;
import com.company.medtech.lab.model.LabTestCombo;
import com.company.medtech.lab.repository.LabTestComboRepository;
import com.company.medtech.lab.repository.LabTestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class LabTestService {

    private final LabTestRepository labTestRepository;
    private final LabTestComboRepository labTestComboRepository;
    private final FranchiseService franchiseService;

    public LabTestService(
            LabTestRepository labTestRepository,
            LabTestComboRepository labTestComboRepository,
            FranchiseService franchiseService
    ) {
        this.labTestRepository = labTestRepository;
        this.labTestComboRepository = labTestComboRepository;
        this.franchiseService = franchiseService;
    }

    public List<LabTestResponse> listTests(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return labTestRepository.findByFranchiseIdAndActiveTrue(franchise.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** Used by patients browsing a franchise's catalog. */
    public List<LabTestResponse> listTestsForFranchise(String franchiseId) {
        UUID id = parseFranchiseId(franchiseId);
        return labTestRepository.findByFranchiseIdAndActiveTrue(id)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public LabTestResponse createTest(String ownerEmail, LabTestRequest request) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);

        LabTest test = new LabTest();
        test.setFranchiseId(franchise.getId());
        test.setName(request.getName());
        test.setPrice(request.getPrice());
        test.setActive(true);

        return toResponse(labTestRepository.save(test));
    }

    @Transactional(readOnly = true)
    public List<LabTestComboResponse> listCombos(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return labTestComboRepository.findByFranchiseIdAndActiveTrue(franchise.getId())
                .stream()
                .map(this::toComboResponse)
                .toList();
    }

    /** Used by patients browsing a franchise's catalog. */
    @Transactional(readOnly = true)
    public List<LabTestComboResponse> listCombosForFranchise(String franchiseId) {
        UUID id = parseFranchiseId(franchiseId);
        return labTestComboRepository.findByFranchiseIdAndActiveTrue(id)
                .stream()
                .map(this::toComboResponse)
                .toList();
    }

    /**
     * Every testId must belong to the caller's own franchise — resolved via
     * the same findByIdAndFranchiseId ownership check ProductService/
     * BillingService use, so a combo can never smuggle in another
     * franchise's test.
     */
    @Transactional
    public LabTestComboResponse createCombo(String ownerEmail, LabTestComboRequest request) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);

        List<LabTest> tests = request.getTestIds().stream()
                .map(testId -> labTestRepository.findByIdAndFranchiseId(parseId(testId), franchise.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("LabTest", "id", testId)))
                .toList();

        LabTestCombo combo = new LabTestCombo();
        combo.setFranchiseId(franchise.getId());
        combo.setName(request.getName());
        combo.setComboPrice(request.getComboPrice());
        combo.setActive(true);
        combo.setTests(tests);

        return toComboResponse(labTestComboRepository.save(combo));
    }

    private UUID parseFranchiseId(String franchiseId) {
        try {
            return UUID.fromString(franchiseId);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Franchise", "id", franchiseId);
        }
    }

    private UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("LabTest", "id", id);
        }
    }

    private LabTestResponse toResponse(LabTest test) {
        return new LabTestResponse(test.getId().toString(), test.getName(), test.getPrice(), test.isActive());
    }

    private LabTestComboResponse toComboResponse(LabTestCombo combo) {
        List<LabTestResponse> testResponses = combo.getTests().stream().map(this::toResponse).toList();
        return new LabTestComboResponse(
                combo.getId().toString(),
                combo.getName(),
                combo.getComboPrice(),
                combo.isActive(),
                testResponses
        );
    }
}
