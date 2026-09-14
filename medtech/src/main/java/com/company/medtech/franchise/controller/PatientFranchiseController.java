package com.company.medtech.franchise.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.franchise.dto.FranchiseResponse;
import com.company.medtech.franchise.service.FranchiseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Lets a patient discover the shop(s) they can order from / book with,
 * without needing a franchise ID shared out of band. Only one franchise
 * exists today, so the client just uses the first (only) result.
 */
@RestController
@RequestMapping(
        value = "/api/patient/franchises",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientFranchiseController {

    private final FranchiseService franchiseService;

    @GetMapping
    public ApiResponse<List<FranchiseResponse>> list() {
        return ApiResponse.success("OK", franchiseService.listActive());
    }
}
