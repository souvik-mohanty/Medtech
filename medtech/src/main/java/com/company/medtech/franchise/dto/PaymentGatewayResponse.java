package com.company.medtech.franchise.dto;

import com.company.medtech.franchise.model.PaymentProvider;
import lombok.AllArgsConstructor;
import lombok.Data;

/** apiSecret is never included here — see CredentialEncryptionService. */
@Data
@AllArgsConstructor
public class PaymentGatewayResponse {

    private PaymentProvider provider;

    /** Masked, e.g. "****ab12". Null if never configured. */
    private String maskedApiKey;

    private boolean configured;
    private boolean active;
}
