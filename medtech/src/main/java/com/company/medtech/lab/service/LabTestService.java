package com.company.medtech.lab.service;

import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.lab.dto.LabTestComboRequest;
import com.company.medtech.lab.dto.LabTestComboResponse;
import com.company.medtech.lab.dto.LabTestRequest;
import com.company.medtech.lab.dto.LabTestResponse;
import com.company.medtech.lab.model.LabTest;
import com.company.medtech.lab.model.LabTestCombo;
import com.company.medtech.lab.repository.LabTestBookingItemRepository;
import com.company.medtech.lab.repository.LabTestBookingRepository;
import com.company.medtech.lab.repository.LabTestComboRepository;
import com.company.medtech.lab.repository.LabTestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class LabTestService {

    private final LabTestRepository labTestRepository;
    private final LabTestComboRepository labTestComboRepository;
    private final LabTestBookingItemRepository labTestBookingItemRepository;
    private final LabTestBookingRepository labTestBookingRepository;
    private final FranchiseService franchiseService;

    public LabTestService(
            LabTestRepository labTestRepository,
            LabTestComboRepository labTestComboRepository,
            LabTestBookingItemRepository labTestBookingItemRepository,
            LabTestBookingRepository labTestBookingRepository,
            FranchiseService franchiseService
    ) {
        this.labTestRepository = labTestRepository;
        this.labTestComboRepository = labTestComboRepository;
        this.labTestBookingItemRepository = labTestBookingItemRepository;
        this.labTestBookingRepository = labTestBookingRepository;
        this.franchiseService = franchiseService;
    }

    /** Owner-facing catalog management — sees every test, active and inactive, so it can be edited/deleted. */
    public List<LabTestResponse> listTests(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return labTestRepository.findByFranchiseIdOrderByNameAsc(franchise.getId())
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
        test.setCode(request.getCode());
        test.setCategory(request.getCategory());
        test.setDescription(request.getDescription());
        test.setSampleType(request.getSampleType());
        test.setPreparationInstructions(request.getPreparationInstructions());
        test.setReportTurnaroundHours(request.getReportTurnaroundHours());
        test.setPrescriptionRequired(request.isPrescriptionRequired());
        test.setGstPercentage(request.getGstPercentage() != null ? request.getGstPercentage() : BigDecimal.ZERO);

        return toResponse(labTestRepository.save(test));
    }

    /** No dedicated deactivate/activate mock counterpart existed on the backend before — mirrors lp-care-web's toggleTestActive. */
    @Transactional
    public LabTestResponse toggleTestActive(String ownerEmail, String testId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTest test = labTestRepository.findByIdAndFranchiseId(parseId(testId), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("LabTest", "id", testId));
        test.setActive(!test.isActive());
        return toResponse(labTestRepository.save(test));
    }

    @Transactional
    public LabTestResponse updateTest(String ownerEmail, String testId, LabTestRequest request) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTest test = labTestRepository.findByIdAndFranchiseId(parseId(testId), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("LabTest", "id", testId));

        test.setName(request.getName());
        test.setPrice(request.getPrice());
        test.setCode(request.getCode());
        test.setCategory(request.getCategory());
        test.setDescription(request.getDescription());
        test.setSampleType(request.getSampleType());
        test.setPreparationInstructions(request.getPreparationInstructions());
        test.setReportTurnaroundHours(request.getReportTurnaroundHours());
        test.setPrescriptionRequired(request.isPrescriptionRequired());
        test.setGstPercentage(request.getGstPercentage() != null ? request.getGstPercentage() : BigDecimal.ZERO);

        return toResponse(labTestRepository.save(test));
    }

    /** Refuses to delete a test with real booking history — the owner should deactivate it instead so past bookings keep their snapshot intact. */
    @Transactional
    public void deleteTest(String ownerEmail, String testId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTest test = labTestRepository.findByIdAndFranchiseId(parseId(testId), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("LabTest", "id", testId));

        if (labTestBookingItemRepository.existsByLabTestId(test.getId())) {
            throw new BusinessException("This test has booking history — deactivate it instead of deleting.");
        }

        labTestRepository.delete(test);
    }

    /** Owner-facing catalog management — sees every package, active and inactive, so it can be edited/deleted. */
    @Transactional(readOnly = true)
    public List<LabTestComboResponse> listCombos(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return labTestComboRepository.findByFranchiseIdOrderByNameAsc(franchise.getId())
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
        combo.setDescription(request.getDescription());
        combo.setPreparationInstructions(request.getPreparationInstructions());
        combo.setReportTurnaroundHours(request.getReportTurnaroundHours());

        return toComboResponse(labTestComboRepository.save(combo));
    }

    @Transactional
    public LabTestComboResponse toggleComboActive(String ownerEmail, String comboId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestCombo combo = labTestComboRepository.findByIdAndFranchiseId(parseId(comboId), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("LabTestCombo", "id", comboId));
        combo.setActive(!combo.isActive());
        return toComboResponse(labTestComboRepository.save(combo));
    }

    @Transactional
    public LabTestComboResponse updateCombo(String ownerEmail, String comboId, LabTestComboRequest request) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestCombo combo = labTestComboRepository.findByIdAndFranchiseId(parseId(comboId), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("LabTestCombo", "id", comboId));

        List<LabTest> tests = request.getTestIds().stream()
                .map(testId -> labTestRepository.findByIdAndFranchiseId(parseId(testId), franchise.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("LabTest", "id", testId)))
                .toList();

        combo.setName(request.getName());
        combo.setComboPrice(request.getComboPrice());
        combo.setTests(tests);
        combo.setDescription(request.getDescription());
        combo.setPreparationInstructions(request.getPreparationInstructions());
        combo.setReportTurnaroundHours(request.getReportTurnaroundHours());

        return toComboResponse(labTestComboRepository.save(combo));
    }

    /** Refuses to delete a package with real booking history — the owner should deactivate it instead so past bookings keep their snapshot intact. */
    @Transactional
    public void deleteCombo(String ownerEmail, String comboId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestCombo combo = labTestComboRepository.findByIdAndFranchiseId(parseId(comboId), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("LabTestCombo", "id", comboId));

        if (labTestBookingRepository.existsByPackageId(combo.getId())) {
            throw new BusinessException("This package has booking history — deactivate it instead of deleting.");
        }

        labTestComboRepository.delete(combo);
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
        return new LabTestResponse(
                test.getId().toString(),
                test.getName(),
                test.getPrice(),
                test.isActive(),
                test.getCode(),
                test.getCategory(),
                test.getDescription(),
                test.getSampleType(),
                test.getPreparationInstructions(),
                test.getReportTurnaroundHours(),
                test.isPrescriptionRequired(),
                test.getGstPercentage()
        );
    }

    private LabTestComboResponse toComboResponse(LabTestCombo combo) {
        List<LabTestResponse> testResponses = combo.getTests().stream().map(this::toResponse).toList();
        BigDecimal totalPrice = combo.getTests().stream()
                .map(LabTest::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new LabTestComboResponse(
                combo.getId().toString(),
                combo.getName(),
                combo.getComboPrice(),
                totalPrice,
                combo.isActive(),
                testResponses,
                combo.getDescription(),
                combo.getPreparationInstructions(),
                combo.getReportTurnaroundHours()
        );
    }
}
