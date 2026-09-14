package com.company.medtech.franchise.service;

import com.company.medtech.auth.model.UserAuth;
import com.company.medtech.auth.repository.UserAuthRepository;
import com.company.medtech.auth.service.JwtService;
import com.company.medtech.common.constants.AppConstants;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.franchise.dto.FranchiseBrandingRequest;
import com.company.medtech.franchise.dto.FranchiseOnboardRequest;
import com.company.medtech.franchise.dto.FranchiseOnboardResponse;
import com.company.medtech.franchise.dto.FranchiseResponse;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FranchiseService {

    private final FranchiseRepository franchiseRepository;
    private final UserAuthRepository userAuthRepository;
    private final JwtService jwtService;

    public FranchiseService(FranchiseRepository franchiseRepository,
                             UserAuthRepository userAuthRepository,
                             JwtService jwtService) {
        this.franchiseRepository = franchiseRepository;
        this.userAuthRepository = userAuthRepository;
        this.jwtService = jwtService;
    }

    /**
     * Turns the caller's own account into a Franchise (shop owner) account —
     * the only way to create a franchise now that there is no admin to
     * provision one. Promotes their UserAuth role and creates their
     * Franchise row in one transaction, then mints a fresh JWT with role
     * FRANCHISE: the caller's existing token still says PATIENT (role is
     * baked in at login), so without a new token every subsequent
     * /api/franchise/** call would 403 until they logged out and back in.
     */
    @Transactional
    public FranchiseOnboardResponse onboard(String ownerEmail, FranchiseOnboardRequest request) {
        if (franchiseRepository.findByOwnerEmail(ownerEmail).isPresent()) {
            throw new BusinessException("You already have a franchise linked to this account");
        }

        UserAuth user = userAuthRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new BusinessException("Account not found"));
        user.setRole(AppConstants.ROLE_FRANCHISE);
        userAuthRepository.save(user);

        Franchise franchise = new Franchise();
        franchise.setOwnerEmail(ownerEmail);
        franchise.setName(request.getName());
        franchise.setGstin(request.getGstin());
        franchise.setContactPhone(request.getContactPhone());
        franchise.setContactEmail(request.getContactEmail());
        franchise.setActive(true);
        franchise = franchiseRepository.save(franchise);

        String token = jwtService.generateToken(ownerEmail, AppConstants.ROLE_FRANCHISE);
        return toOnboardResponse(franchise, token);
    }

    /**
     * Used by other modules (inventory, billing) to resolve "the caller's
     * franchise". Also rejects an inactive franchise here so every
     * franchise-side self-service action (profile, inventory, billing,
     * payment gateway) is blocked in this one place, though nothing
     * currently sets a franchise inactive post-onboarding.
     */
    public Franchise getByOwnerEmail(String ownerEmail) {
        Franchise franchise = franchiseRepository.findByOwnerEmail(ownerEmail)
                .orElseThrow(() -> new BusinessException(
                        "No franchise is linked to this account yet — onboard one first."));

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

    private FranchiseOnboardResponse toOnboardResponse(Franchise franchise, String token) {
        return new FranchiseOnboardResponse(
                franchise.getId().toString(),
                franchise.getName(),
                franchise.getGstin(),
                franchise.getContactPhone(),
                franchise.getContactEmail(),
                franchise.getLogoUrl(),
                franchise.getAccentColorHex(),
                franchise.getInvoiceFont(),
                franchise.getInvoiceFooterNote(),
                franchise.getInvoicePrefix(),
                token,
                AppConstants.ROLE_FRANCHISE
        );
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
