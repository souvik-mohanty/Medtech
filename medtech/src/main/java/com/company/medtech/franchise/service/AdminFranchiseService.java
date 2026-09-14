package com.company.medtech.franchise.service;

import com.company.medtech.auth.model.UserAuth;
import com.company.medtech.auth.repository.UserAuthRepository;
import com.company.medtech.common.constants.AppConstants;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.franchise.dto.AdminFranchiseRequest;
import com.company.medtech.franchise.dto.AdminFranchiseResponse;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Admin-only franchise onboarding — the app-level replacement for the
 * "insert directly into Postgres" gap flagged throughout this project.
 * Creates both the Franchise row and (if needed) the owner's UserAuth in
 * one transaction, so the two can never end up inconsistent.
 */
@Service
public class AdminFranchiseService {

    private final FranchiseRepository franchiseRepository;
    private final UserAuthRepository userAuthRepository;

    public AdminFranchiseService(FranchiseRepository franchiseRepository, UserAuthRepository userAuthRepository) {
        this.franchiseRepository = franchiseRepository;
        this.userAuthRepository = userAuthRepository;
    }

    @Transactional
    public AdminFranchiseResponse create(AdminFranchiseRequest request) {
        if (franchiseRepository.findByOwnerEmail(request.getOwnerEmail()).isPresent()) {
            throw new BusinessException("A franchise is already linked to this owner email");
        }

        resolveOwnerAccount(request.getOwnerEmail());

        Franchise franchise = new Franchise();
        franchise.setOwnerEmail(request.getOwnerEmail());
        franchise.setName(request.getName());
        franchise.setGstin(request.getGstin());
        franchise.setContactPhone(request.getContactPhone());
        franchise.setContactEmail(request.getContactEmail());
        franchise.setActive(true);

        return toResponse(franchiseRepository.save(franchise));
    }

    public List<AdminFranchiseResponse> list() {
        return franchiseRepository.findAll().stream().map(this::toResponse).toList();
    }

    public AdminFranchiseResponse setActive(String id, boolean active) {
        Franchise franchise = franchiseRepository.findById(parseId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Franchise", "id", id));
        franchise.setActive(active);
        return toResponse(franchiseRepository.save(franchise));
    }

    /**
     * If the email already has an account, promotes it to FRANCHISE — but
     * only if it's currently PATIENT (self-registered, the common case) or
     * already FRANCHISE (idempotent re-onboarding). An email already
     * belonging to some other role (Doctor, Admin, etc.) is refused rather
     * than silently overwritten, since that's far more likely a typo than
     * an intentional role change.
     */
    private void resolveOwnerAccount(String ownerEmail) {
        UserAuth user = userAuthRepository.findByEmail(ownerEmail).orElse(null);

        if (user == null) {
            user = new UserAuth();
            user.setEmail(ownerEmail);
            user.setActive(true);
        } else if (!AppConstants.ROLE_PATIENT.equals(user.getRole()) && !AppConstants.ROLE_FRANCHISE.equals(user.getRole())) {
            throw new BusinessException(
                    "This email is already registered as " + user.getRole()
                            + " — use a different email, or fix that account first");
        }

        user.setRole(AppConstants.ROLE_FRANCHISE);
        userAuthRepository.save(user);
    }

    private UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Franchise", "id", id);
        }
    }

    private AdminFranchiseResponse toResponse(Franchise franchise) {
        return new AdminFranchiseResponse(
                franchise.getId().toString(),
                franchise.getOwnerEmail(),
                franchise.getName(),
                franchise.getGstin(),
                franchise.getContactPhone(),
                franchise.getContactEmail(),
                franchise.isActive()
        );
    }
}
