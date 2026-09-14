package com.company.medtech.lab.model;

/**
 * Mirrors lp-care-web's BookingStatus verbatim — a brand-new enum with no
 * legacy name to preserve, unlike the FRANCHISE/OWNER role case.
 * common.enums.OrderStatus stays reserved for billing/ and consultation/
 * only; it isn't repurposed here since DISPATCHED/DELIVERED are
 * retail-shipping concepts with no lab equivalent.
 */
public enum BookingStatus {
    PENDING_PAYMENT,
    CONFIRMED,
    SAMPLE_COLLECTION_SCHEDULED,
    SAMPLE_COLLECTED,
    PROCESSING,
    REPORT_READY,
    COMPLETED,
    CANCELLED,
    PAYMENT_FAILED
}
