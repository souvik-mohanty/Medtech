package com.company.medtech.billing.model;

/** How a per-bill discount value is interpreted — see BillingService#applyDiscount. */
public enum DiscountType {
    FLAT,
    PERCENTAGE
}
