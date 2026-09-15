package com.company.medtech.coupon.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.coupon.dto.CouponRequest;
import com.company.medtech.coupon.dto.CouponResponse;
import com.company.medtech.coupon.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** The franchise owner's discount coupons — flat or percentage, franchise-scoped. */
@RestController
@RequestMapping(
        value = "/api/franchise/coupons",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class FranchiseCouponController {

    private final CouponService couponService;

    @GetMapping
    public ApiResponse<List<CouponResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", couponService.listForFranchise(authentication.getName()));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<CouponResponse> create(Authentication authentication, @Valid @RequestBody CouponRequest request) {
        return ApiResponse.success("Coupon created", couponService.create(authentication.getName(), request));
    }

    @PatchMapping("/{id}/toggle-active")
    public ApiResponse<CouponResponse> toggleActive(Authentication authentication, @PathVariable String id) {
        return ApiResponse.success("OK", couponService.toggleActive(authentication.getName(), id));
    }
}
