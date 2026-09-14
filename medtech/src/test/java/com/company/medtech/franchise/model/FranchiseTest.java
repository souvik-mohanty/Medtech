package com.company.medtech.franchise.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FranchiseTest {

    @Test
    void hasNoActivePaymentGatewayByDefault() {
        Franchise franchise = new Franchise();

        assertThat(franchise.hasActivePaymentGateway()).isFalse();
    }

    @Test
    void hasActivePaymentGatewayOnceFullyConfigured() {
        Franchise franchise = new Franchise();

        PaymentGatewayConfig config = new PaymentGatewayConfig();
        config.setProvider(PaymentProvider.RAZORPAY);
        config.setApiKey("rzp_live_abc123");
        config.setEncryptedApiSecret("encrypted-blob");
        config.setActive(true);
        franchise.setPaymentGateway(config);

        assertThat(franchise.hasActivePaymentGateway()).isTrue();
    }

    @Test
    void isNotActiveWhenDisabledEvenIfCredentialsArePresent() {
        Franchise franchise = new Franchise();

        PaymentGatewayConfig config = new PaymentGatewayConfig();
        config.setProvider(PaymentProvider.PHONEPE);
        config.setApiKey("merchant-id");
        config.setEncryptedApiSecret("encrypted-blob");
        config.setActive(false);
        franchise.setPaymentGateway(config);

        assertThat(franchise.hasActivePaymentGateway()).isFalse();
    }

    @Test
    void isNotActiveWhenProviderIsNone() {
        Franchise franchise = new Franchise();

        PaymentGatewayConfig config = new PaymentGatewayConfig();
        config.setProvider(PaymentProvider.NONE);
        config.setApiKey("some-key");
        config.setEncryptedApiSecret("encrypted-blob");
        config.setActive(true);
        franchise.setPaymentGateway(config);

        assertThat(franchise.hasActivePaymentGateway()).isFalse();
    }
}
