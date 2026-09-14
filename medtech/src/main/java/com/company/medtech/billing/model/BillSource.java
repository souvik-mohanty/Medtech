package com.company.medtech.billing.model;

public enum BillSource {
    /** Franchise staff bill a walk-in customer at the counter; paid in cash immediately. */
    FRANCHISE_COUNTER,
    /** A patient's online order; paid via the (not yet built) online payment gateway. */
    PATIENT_ONLINE
}
