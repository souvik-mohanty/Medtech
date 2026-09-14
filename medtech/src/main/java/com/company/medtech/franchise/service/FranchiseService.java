package com.company.medtech.franchise.service;

import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.franchise.dto.FranchiseBrandingRequest;
import com.company.medtech.franchise.dto.FranchiseResponse;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import org.springframework.stereotype.Service;

@Service
public class FranchiseService {

    private final FranchiseRepository franchiseRepository;

    public FranchiseService(FranchiseRepository franchiseRepository) {
        this.franchiseRepository = franchiseRepository;
    }

    /**
     * Used by other modules (inventory, billing) to resolve "the caller's
     * franchise". Rejects a suspended franchise here so every franchise-side
     * self-service action (profile, inventory, billing, payment gateway) is
     * blocked in this one place — see AdminFranchiseService#setActive.
     */
    public Franchise getByOwnerEmail(String ownerEmail) {
        Franchise franchise = franchiseRepository.findByOwnerEmail(ownerEmail)
                .orElseThrow(() -> new BusinessException(
                        "No franchise is linked to this account yet. Ask an admin to provision it."));

        if (!franchise.isActive()) {
            throw new BusinessException("This franchise has been suspended. Contact support.");
        }

        return franchise;
    }

    public FranchiseResponse getProfile(String ownerEmail) {
        return toResponse(getByOwnerEmail(ownerEmail));
    }

    public FranchiseResponse updateBranding(String ownerEmail, FranchiseBrandingRequest request) {
        Franchise franchise = getByOwnerEmail(ownerEmail);

        franchise.setName(request.getName());
        franchise.setGstin(request.getGstin());
        franchise.setContactPhone(request.getContactPhone());
        franchise.setContactEmail(request.getContactEmail());
        franchise.setLogoUrl(request.getLogoUrl());

        if (request.getAccentColorHex() != null) {
            franchise.setAccentColorHex(request.getAccentColorHex());
        }
        if (request.getInvoiceFont() != null) {
            franchise.setInvoiceFont(request.getInvoiceFont());
        }
        franchise.setInvoiceFooterNote(request.getInvoiceFooterNote());
        if (request.getInvoicePrefix() != null && !request.getInvoicePrefix().isBlank()) {
            franchise.setInvoicePrefix(request.getInvoicePrefix().trim().toUpperCase());
        }

        return toResponse(franchiseRepository.save(franchise));
    }

    private FranchiseResponse toResponse(Franchise franchise) {
        return new FranchiseResponse(
                franchise.getId().toString(),
                franchise.getName(),
                franchise.getGstin(),
                franchise.getContactPhone(),
                franchise.getContactEmail(),
                franchise.getLogoUrl(),
                franchise.getAccentColorHex(),
                franchise.getInvoiceFont(),
                franchise.getInvoiceFooterNote(),
                franchise.getInvoicePrefix()
        );
    }
}
