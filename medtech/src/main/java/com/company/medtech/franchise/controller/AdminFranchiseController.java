package com.company.medtech.franchise.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.franchise.dto.AdminFranchiseRequest;
import com.company.medtech.franchise.dto.AdminFranchiseResponse;
import com.company.medtech.franchise.service.AdminFranchiseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin-only (SecurityConfig already restricts /api/admin/** to ROLE_ADMIN). */
@RestController
@RequestMapping(
        value = "/api/admin/franchises",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class AdminFranchiseController {

    private final AdminFranchiseService adminFranchiseService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<AdminFranchiseResponse> create(@Valid @RequestBody AdminFranchiseRequest request) {
        return ApiResponse.success("Franchise onboarded", adminFranchiseService.create(request));
    }

    @GetMapping
    public ApiResponse<List<AdminFranchiseResponse>> list() {
        return ApiResponse.success("OK", adminFranchiseService.list());
    }

    @PatchMapping("/{id}/suspend")
    public ApiResponse<AdminFranchiseResponse> suspend(@PathVariable String id) {
        return ApiResponse.success("Franchise suspended", adminFranchiseService.setActive(id, false));
    }

    @PatchMapping("/{id}/reactivate")
    public ApiResponse<AdminFranchiseResponse> reactivate(@PathVariable String id) {
        return ApiResponse.success("Franchise reactivated", adminFranchiseService.setActive(id, true));
    }
}
