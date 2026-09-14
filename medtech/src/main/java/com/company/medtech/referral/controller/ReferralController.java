package com.company.medtech.referral.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.referral.dto.ReferralRequest;
import com.company.medtech.referral.dto.ReferralResponse;
import com.company.medtech.referral.dto.SettleReferralRequest;
import com.company.medtech.referral.service.ReferralService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The franchise owner's referral roster (doctors or anyone else who refers patients in), each with their own commission rate. */
@RestController
@RequestMapping(
        value = "/api/franchise/referrals",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class ReferralController {

    private final ReferralService referralService;

    @GetMapping
    public ApiResponse<List<ReferralResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", referralService.list(authentication.getName()));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ReferralResponse> create(Authentication authentication, @Valid @RequestBody ReferralRequest request) {
        return ApiResponse.success("Referral added", referralService.create(authentication.getName(), request));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ReferralResponse> update(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody ReferralRequest request
    ) {
        return ApiResponse.success("Referral updated", referralService.update(authentication.getName(), id, request));
    }

    @PatchMapping("/{id}/toggle-active")
    public ApiResponse<ReferralResponse> toggleActive(Authentication authentication, @PathVariable String id) {
        return ApiResponse.success("Referral updated", referralService.toggleActive(authentication.getName(), id));
    }

    @PatchMapping(value = "/{id}/settle", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ReferralResponse> settle(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody SettleReferralRequest request
    ) {
        return ApiResponse.success("Settlement recorded", referralService.settle(authentication.getName(), id, request.getAmount()));
    }
}
