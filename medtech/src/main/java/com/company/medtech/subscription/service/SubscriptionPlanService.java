package com.company.medtech.subscription.service;

import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.subscription.dto.SubscriptionPlanRequest;
import com.company.medtech.subscription.dto.SubscriptionPlanResponse;
import com.company.medtech.subscription.model.SubscriptionPlan;
import com.company.medtech.subscription.repository.SubscriptionPlanRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class SubscriptionPlanService {

    private final SubscriptionPlanRepository planRepository;

    public SubscriptionPlanService(SubscriptionPlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    public SubscriptionPlanResponse create(SubscriptionPlanRequest request) {
        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setName(request.getName());
        plan.setPrice(request.getPrice());
        plan.setFeatures(request.getFeatures());
        plan.setActive(true);
        plan.setCreatedAt(LocalDateTime.now());

        return toResponse(planRepository.save(plan));
    }

    public List<SubscriptionPlanResponse> list() {
        return planRepository.findAll().stream().map(this::toResponse).toList();
    }

    public SubscriptionPlanResponse update(String id, SubscriptionPlanRequest request) {
        SubscriptionPlan plan = getOrThrow(id);
        plan.setName(request.getName());
        plan.setPrice(request.getPrice());
        plan.setFeatures(request.getFeatures());

        return toResponse(planRepository.save(plan));
    }

    public SubscriptionPlanResponse setActive(String id, boolean active) {
        SubscriptionPlan plan = getOrThrow(id);
        plan.setActive(active);

        return toResponse(planRepository.save(plan));
    }

    private SubscriptionPlan getOrThrow(String id) {
        UUID planId;
        try {
            planId = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("SubscriptionPlan", "id", id);
        }

        return planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", "id", id));
    }

    private SubscriptionPlanResponse toResponse(SubscriptionPlan plan) {
        return new SubscriptionPlanResponse(
                plan.getId().toString(),
                plan.getName(),
                plan.getPrice(),
                plan.getFeatures(),
                plan.isActive(),
                plan.getCreatedAt()
        );
    }
}
