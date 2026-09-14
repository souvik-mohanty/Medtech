package com.company.medtech.franchise.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

/**
 * Each franchise brings its own Razorpay or PhonePe account — there is no
 * platform-wide gateway credential. {@code apiKey} is Razorpay's Key ID /
 * PhonePe's Merchant ID (not secret, safe to echo back masked).
 * {@code encryptedApiSecret} is Razorpay's Key Secret / PhonePe's Salt Key —
 * AES-GCM encrypted at rest via CredentialEncryptionService, NEVER returned
 * by any API response. See Franchise#hasActivePaymentGateway: if this isn't
 * configured and active, the franchise cannot accept online payment and
 * every sale falls back to cash.
 */
@Embeddable
public class PaymentGatewayConfig {

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_provider", nullable = false)
    private PaymentProvider provider = PaymentProvider.NONE;

    @Column(name = "payment_api_key")
    private String apiKey;

    @Column(name = "payment_encrypted_api_secret")
    private String encryptedApiSecret;

    @Column(name = "payment_active", nullable = false)
    private boolean active;

    public PaymentProvider getProvider() {
        return provider;
    }

    public void setProvider(PaymentProvider provider) {
        this.provider = provider;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getEncryptedApiSecret() {
        return encryptedApiSecret;
    }

    public void setEncryptedApiSecret(String encryptedApiSecret) {
        this.encryptedApiSecret = encryptedApiSecret;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
