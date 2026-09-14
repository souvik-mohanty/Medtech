package com.company.medtech.inventory.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.inventory.dto.ProductResponse;
import com.company.medtech.inventory.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** A patient browsing a specific franchise's catalog before placing an online order. */
@RestController
@RequestMapping(
        value = "/api/patient/franchises/{franchiseId}/products",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<List<ProductResponse>> list(@PathVariable String franchiseId) {
        return ApiResponse.success("OK", productService.listForFranchise(franchiseId));
    }
}
