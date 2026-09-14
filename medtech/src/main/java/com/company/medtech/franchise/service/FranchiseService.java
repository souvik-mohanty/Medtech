package com.company.medtech.franchise.service;

import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.franchise.dto.FranchiseBrandingRequest;
import com.company.medtech.franchise.dto.FranchiseResponse;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
        franchise.setInvoiceHeaderNote(request.getInvoiceHeaderNote());
        franchise.setInvoiceFooterNote(request.getInvoiceFooterNote());
        if (request.getInvoicePrefix() != null && !request.getInvoicePrefix().isBlank()) {
            franchise.setInvoicePrefix(request.getInvoicePrefix().trim().toUpperCase());
        }
        franchise.setCollectionCharge(request.getCollectionCharge());
        franchise.setFreeCollectionMinOrder(request.getFreeCollectionMinOrder());

        if (request.getServiceablePincodes() != null) {
            Set<String> normalized = new HashSet<>();
            for (String pincode : request.getServiceablePincodes()) {
                if (pincode != null && !pincode.isBlank()) {
                    normalized.add(pincode.trim());
                }
            }
            franchise.setServiceablePincodes(normalized);
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
                franchise.getInvoiceHeaderNote(),
                franchise.getInvoiceFooterNote(),
                franchise.getInvoicePrefix(),
                franchise.getCollectionCharge(),
                franchise.getFreeCollectionMinOrder(),
                franchise.getServiceablePincodes().stream().sorted().toList()
        );
    }

    /**
     * Used at address-creation time (PatientProfileService#addAddress) and
     * for walk-in home-collection bookings. Only one franchise exists today
     * (see class-level convention elsewhere in this codebase), so this
     * resolves "the" active franchise the same way listActive()'s callers
     * do. An unconfigured pincode set (nothing added yet in Settings) means
     * no restriction — every pincode passes — so this feature can't
     * silently block bookings before an owner has set it up.
     */
    public void assertPincodeServiceable(String pincode) {
        List<Franchise> active = franchiseRepository.findByActiveTrue();
        if (active.isEmpty()) {
            return;
        }
        Franchise franchise = active.get(0);
        Set<String> configured = franchise.getServiceablePincodes();
        if (configured.isEmpty()) {
            return;
        }
        if (pincode == null || !configured.contains(pincode.trim())) {
            throw new BusinessException("Sorry, we don't currently serve pincode " + pincode + ".");
        }
    }
}
