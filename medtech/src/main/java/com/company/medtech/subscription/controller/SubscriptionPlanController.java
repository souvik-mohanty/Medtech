package com.company.medtech.subscription.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.subscription.dto.SubscriptionPlanRequest;
import com.company.medtech.subscription.dto.SubscriptionPlanResponse;
import com.company.medtech.subscription.service.SubscriptionPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only (SecurityConfig already restricts /api/admin/** to ROLE_ADMIN).
 * This is the plan catalog only — creating/editing plans. There is no link
 * yet from a Franchise to a chosen plan, and PlanFeature isn't enforced
 * anywhere (see PlanFeature javadoc).
 */
@RestController
@RequestMapping(
        value = "/api/admin/subscription-plans",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class SubscriptionPlanController {

    private final SubscriptionPlanService planService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<SubscriptionPlanResponse> create(@Valid @RequestBody SubscriptionPlanRequest request) {
        return ApiResponse.success("Plan created", planService.create(request));
    }

    @GetMapping
    public ApiResponse<List<SubscriptionPlanResponse>> list() {
        return ApiResponse.success("OK", planService.list());
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<SubscriptionPlanResponse> update(
            @PathVariable String id,
            @Valid @RequestBody SubscriptionPlanRequest request
    ) {
        return ApiResponse.success("Plan updated", planService.update(id, request));
    }

    @PatchMapping("/{id}/deactivate")
    public ApiResponse<SubscriptionPlanResponse> deactivate(@PathVariable String id) {
        return ApiResponse.success("Plan deactivated", planService.setActive(id, false));
    }

    @PatchMapping("/{id}/reactivate")
    public ApiResponse<SubscriptionPlanResponse> reactivate(@PathVariable String id) {
        return ApiResponse.success("Plan reactivated", planService.setActive(id, true));
    }
}
