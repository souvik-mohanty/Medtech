package com.company.medtech.inventory.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.inventory.dto.InventoryInsightsResponse;
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
        value = "/api/franchise/inventory",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/products")
    public ApiResponse<List<ProductResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", productService.listForOwner(authentication.getName()));
    }

    @PostMapping(value = "/products", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ProductResponse> create(
            Authentication authentication,
            @Valid @RequestBody ProductRequest request
    ) {
        return ApiResponse.success("Product added", productService.create(authentication.getName(), request));
    }

    @PutMapping(value = "/products/{productId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ProductResponse> update(
            Authentication authentication,
            @PathVariable String productId,
            @Valid @RequestBody ProductRequest request
    ) {
        return ApiResponse.success("Product updated", productService.update(authentication.getName(), productId, request));
    }

    @PatchMapping("/products/{productId}/toggle-active")
    public ApiResponse<ProductResponse> toggleActive(Authentication authentication, @PathVariable String productId) {
        return ApiResponse.success("Product updated", productService.toggleActive(authentication.getName(), productId));
    }

    @GetMapping("/insights")
    public ApiResponse<InventoryInsightsResponse> insights(Authentication authentication) {
        return ApiResponse.success("OK", productService.getInsights(authentication.getName()));
    }
}
