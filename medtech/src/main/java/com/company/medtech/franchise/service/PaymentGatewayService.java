package com.company.medtech.franchise.service;

import com.company.medtech.common.security.CredentialEncryptionService;
import com.company.medtech.franchise.dto.PaymentGatewayRequest;
import com.company.medtech.franchise.dto.PaymentGatewayResponse;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.model.PaymentGatewayConfig;
import com.company.medtech.franchise.model.PaymentProvider;
import com.company.medtech.franchise.repository.FranchiseRepository;
import org.springframework.stereotype.Service;

@Service
public class PaymentGatewayService {

    private final FranchiseRepository franchiseRepository;
    private final FranchiseService franchiseService;
    private final CredentialEncryptionService encryptionService;

    public PaymentGatewayService(
            FranchiseRepository franchiseRepository,
            FranchiseService franchiseService,
            CredentialEncryptionService encryptionService
    ) {
        this.franchiseRepository = franchiseRepository;
        this.franchiseService = franchiseService;
        this.encryptionService = encryptionService;
    }

    public PaymentGatewayResponse getStatus(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return toResponse(franchise.getPaymentGateway());
    }

    public PaymentGatewayResponse configure(String ownerEmail, PaymentGatewayRequest request) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);

        PaymentGatewayConfig config = new PaymentGatewayConfig();
        config.setProvider(request.getProvider());
        config.setApiKey(request.getApiKey());
        config.setEncryptedApiSecret(encryptionService.encrypt(request.getApiSecret()));
        config.setActive(true);

        franchise.setPaymentGateway(config);
        franchiseRepository.save(franchise);

        return toResponse(config);
    }

    /** Turns online payment off without discarding the stored credentials. */
    public PaymentGatewayResponse disable(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);

        if (franchise.getPaymentGateway() != null) {
            franchise.getPaymentGateway().setActive(false);
            franchiseRepository.save(franchise);
        }

        return toResponse(franchise.getPaymentGateway());
    }

    private PaymentGatewayResponse toResponse(PaymentGatewayConfig config) {
        if (config == null || config.getProvider() == PaymentProvider.NONE) {
            return new PaymentGatewayResponse(PaymentProvider.NONE, null, false, false);
        }

        return new PaymentGatewayResponse(
                config.getProvider(),
                maskKey(config.getApiKey()),
                true,
                config.isActive()
        );
    }

    private String maskKey(String apiKey) {
        if (apiKey == null || apiKey.length() <= 4) {
            return "****";
        }
        return "****" + apiKey.substring(apiKey.length() - 4);
    }
}
