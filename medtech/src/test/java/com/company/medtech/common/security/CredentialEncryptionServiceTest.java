package com.company.medtech.common.security;

import org.junit.jupiter.api.Test;

import java.security.SecureRandom;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

class CredentialEncryptionServiceTest {

    private final CredentialEncryptionService service = new CredentialEncryptionService(randomBase64Key());

    @Test
    void decryptReturnsTheOriginalPlaintext() {
        String secret = "rzp_live_super_secret_key_12345";

        String encrypted = service.encrypt(secret);

        assertThat(encrypted).isNotEqualTo(secret);
        assertThat(service.decrypt(encrypted)).isEqualTo(secret);
    }

    @Test
    void encryptingTheSameSecretTwiceProducesDifferentCiphertext() {
        String secret = "same-secret";

        String first = service.encrypt(secret);
        String second = service.encrypt(secret);

        // Random IV per call — ciphertext must differ even for identical input.
        assertThat(first).isNotEqualTo(second);
        assertThat(service.decrypt(first)).isEqualTo(secret);
        assertThat(service.decrypt(second)).isEqualTo(secret);
    }

    private static String randomBase64Key() {
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }
}
