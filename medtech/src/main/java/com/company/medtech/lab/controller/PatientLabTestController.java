package com.company.medtech.lab.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.lab.dto.LabTestComboResponse;
import com.company.medtech.lab.dto.LabTestResponse;
import com.company.medtech.lab.service.LabTestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** A patient browsing a specific franchise's lab test catalog. */
@RestController
@RequestMapping(
        value = "/api/patient/franchises/{franchiseId}/labtests",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientLabTestController {

    private final LabTestService labTestService;

    @GetMapping
    public ApiResponse<List<LabTestResponse>> listTests(@PathVariable String franchiseId) {
        return ApiResponse.success("OK", labTestService.listTestsForFranchise(franchiseId));
    }

    @GetMapping("/combos")
    public ApiResponse<List<LabTestComboResponse>> listCombos(@PathVariable String franchiseId) {
        return ApiResponse.success("OK", labTestService.listCombosForFranchise(franchiseId));
    }
}
