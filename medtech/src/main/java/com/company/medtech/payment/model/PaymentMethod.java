package com.company.medtech.payment.model;

/** Separate from billing.model.PaymentMode (CASH/ONLINE), which stays as-is for billing/'s medicine orders. */
public enum PaymentMethod {
    UPI,
    CARD,
    NETBANKING,
    WALLET,
    CASH
}
