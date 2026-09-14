package com.company.medtech.lab.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.lab.dto.LabTestComboRequest;
import com.company.medtech.lab.dto.LabTestComboResponse;
import com.company.medtech.lab.dto.LabTestRequest;
import com.company.medtech.lab.dto.LabTestResponse;
import com.company.medtech.lab.service.LabTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Franchise owner's lab test catalog — individual tests and combo packages. */
@RestController
@RequestMapping(
        value = "/api/franchise/labtests",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class LabTestController {

    private final LabTestService labTestService;

    @GetMapping
    public ApiResponse<List<LabTestResponse>> listTests(Authentication authentication) {
        return ApiResponse.success("OK", labTestService.listTests(authentication.getName()));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<LabTestResponse> createTest(
            Authentication authentication,
            @Valid @RequestBody LabTestRequest request
    ) {
        return ApiResponse.success("Lab test added", labTestService.createTest(authentication.getName(), request));
    }

    @PatchMapping("/{id}/toggle-active")
    public ApiResponse<LabTestResponse> toggleTestActive(Authentication authentication, @PathVariable String id) {
        return ApiResponse.success("Test updated", labTestService.toggleTestActive(authentication.getName(), id));
    }

    @GetMapping("/combos")
    public ApiResponse<List<LabTestComboResponse>> listCombos(Authentication authentication) {
        return ApiResponse.success("OK", labTestService.listCombos(authentication.getName()));
    }

    @PostMapping(value = "/combos", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<LabTestComboResponse> createCombo(
            Authentication authentication,
            @Valid @RequestBody LabTestComboRequest request
    ) {
        return ApiResponse.success("Combo added", labTestService.createCombo(authentication.getName(), request));
    }

    @PatchMapping("/combos/{id}/toggle-active")
    public ApiResponse<LabTestComboResponse> toggleComboActive(Authentication authentication, @PathVariable String id) {
        return ApiResponse.success("Package updated", labTestService.toggleComboActive(authentication.getName(), id));
    }
}
