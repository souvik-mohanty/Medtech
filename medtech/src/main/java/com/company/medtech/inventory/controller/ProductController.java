package com.company.medtech.inventory.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.inventory.dto.ProductRequest;
import com.company.medtech.inventory.dto.ProductResponse;
import com.company.medtech.inventory.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Franchise owner's own inventory — the catalog billing selects products from. */
@RestController
@RequestMapping(
        value = "/api/franchise/inventory/products",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ApiResponse<List<ProductResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", productService.listForOwner(authentication.getName()));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ProductResponse> create(
            Authentication authentication,
            @Valid @RequestBody ProductRequest request
    ) {
        return ApiResponse.success("Product added", productService.create(authentication.getName(), request));
    }
}
