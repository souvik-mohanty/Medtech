package com.company.medtech.subscription.model;

/**
 * The optional service modules a subscription plan can grant a franchise.
 * Not yet enforced anywhere — the Doctor Consultation Booking and Lab Test
 * Booking backend modules don't exist yet, and there is no link from
 * Franchise to a chosen plan. This is the plan catalog only (admin builds
 * plans; assigning one to a franchise and gating features by it is a
 * separate, not-yet-built step).
 */
public enum PlanFeature {
    DOCTOR_APPOINTMENT,
    LAB_SERVICES,
    DELIVERY
}
