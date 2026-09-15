package com.company.medtech.coupon.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.coupon.dto.CouponResponse;
import com.company.medtech.coupon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

/** A patient checking whether a coupon code is valid before it's actually applied at checkout — see CouponService#redeem for the real, state-changing apply step. */
@RestController
@RequestMapping(
        value = "/api/patient/franchises/{franchiseId}/coupons",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientCouponController {

    private final CouponService couponService;

    @GetMapping("/validate")
    public ApiResponse<CouponResponse> validate(
            @PathVariable String franchiseId,
            @RequestParam String code,
            @RequestParam BigDecimal orderAmount
    ) {
        return ApiResponse.success("OK", couponService.validate(franchiseId, code, orderAmount));
    }
}
