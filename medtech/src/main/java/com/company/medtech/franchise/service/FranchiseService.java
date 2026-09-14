package com.company.medtech.franchise.service;

import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.franchise.dto.FranchiseBrandingRequest;
import com.company.medtech.franchise.dto.FranchiseResponse;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FranchiseService {

    private final FranchiseRepository franchiseRepository;

    public FranchiseService(FranchiseRepository franchiseRepository) {
        this.franchiseRepository = franchiseRepository;
    }

    /**
     * Used by other modules (inventory, billing) to resolve "the caller's
     * franchise". Also rejects an inactive franchise here so every
     * franchise-side self-service action (profile, inventory, billing,
     * payment gateway) is blocked in this one place.
     */
    public Franchise getByOwnerEmail(String ownerEmail) {
        Franchise franchise = franchiseRepository.findByOwnerEmail(ownerEmail)
                .orElseThrow(() -> new BusinessException("No franchise is linked to this account."));

        if (!franchise.isActive()) {
            throw new BusinessException("This franchise has been suspended. Contact support.");
        }

        return franchise;
    }

    public FranchiseResponse getProfile(String ownerEmail) {
        return toResponse(getByOwnerEmail(ownerEmail));
    }

    /**
     * Patient-facing "which shop(s) can I use" lookup — only one franchise
     * exists today (provisioned directly in Postgres, same as every
     * account except Patient — see CLAUDE.md), but this stays a list (not
     * a single "the" franchise) so a second one added later needs no API
     * shape change.
     */
    public List<FranchiseResponse> listActive() {
        return franchiseRepository.findByActiveTrue().stream().map(this::toResponse).toList();
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
