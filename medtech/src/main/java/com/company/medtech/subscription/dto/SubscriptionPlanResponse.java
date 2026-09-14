package com.company.medtech.subscription.dto;

import com.company.medtech.subscription.model.PlanFeature;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@AllArgsConstructor
public class SubscriptionPlanResponse {

    private String id;
    private String name;
    private BigDecimal price;
    private Set<PlanFeature> features;
    private boolean active;
    private LocalDateTime createdAt;
}
