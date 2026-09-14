package com.company.medtech.referral.service;

import com.company.medtech.billing.repository.BillRepository;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.lab.repository.LabTestBookingRepository;
import com.company.medtech.referral.dto.ReferralRequest;
import com.company.medtech.referral.dto.ReferralResponse;
import com.company.medtech.referral.model.Referral;
import com.company.medtech.referral.repository.ReferralRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReferralService {

    private final ReferralRepository referralRepository;
    private final FranchiseService franchiseService;
    private final LabTestBookingRepository bookingRepository;
    private final BillRepository billRepository;

    public ReferralService(
            ReferralRepository referralRepository,
            FranchiseService franchiseService,
            LabTestBookingRepository bookingRepository,
            BillRepository billRepository
    ) {
        this.referralRepository = referralRepository;
        this.franchiseService = franchiseService;
        this.bookingRepository = bookingRepository;
        this.billRepository = billRepository;
    }

    @Transactional(readOnly = true)
    public List<ReferralResponse> list(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return referralRepository.findByFranchiseIdOrderByNameAsc(franchise.getId()).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ReferralResponse create(String ownerEmail, ReferralRequest request) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);

        Referral referral = new Referral();
        referral.setFranchiseId(franchise.getId());
        applyFields(referral, request);
        referral.setCreatedAt(LocalDateTime.now());

        return toResponse(referralRepository.save(referral));
    }

    @Transactional
    public ReferralResponse update(String ownerEmail, String id, ReferralRequest request) {
        Referral referral = findOwned(ownerEmail, id);
        applyFields(referral, request);
        return toResponse(referralRepository.save(referral));
    }

    @Transactional
    public ReferralResponse toggleActive(String ownerEmail, String id) {
        Referral referral = findOwned(ownerEmail, id);
        referral.setActive(!referral.isActive());
        return toResponse(referralRepository.save(referral));
    }

    /** Records a commission payout to this referral, on top of whatever's already been settled — capped at what's actually owed. */
    @Transactional
    public ReferralResponse settle(String ownerEmail, String id, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Settlement amount must be positive");
        }
        Referral referral = findOwned(ownerEmail, id);
        BigDecimal totalEarned = totalEarned(referral.getId());
        BigDecimal newSettled = referral.getSettledAmount().add(amount).min(totalEarned);
        referral.setSettledAmount(newSettled);
        return toResponse(referralRepository.save(referral));
    }

    private Referral findOwned(String ownerEmail, String id) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return referralRepository.findByIdAndFranchiseId(parseId(id), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Referral", "id", id));
    }

    private void applyFields(Referral referral, ReferralRequest request) {
        referral.setName(request.getName());
        referral.setType(request.getType());
        referral.setPhone(request.getPhone());
        referral.setCommissionType(request.getCommissionType());
        referral.setCommissionValue(request.getCommissionValue());
    }

    private UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Referral", "id", id);
        }
    }

    /** Sum of referral_commission across every booking/bill this referral is credited on — always computed live, never stored, so it can't drift. */
    private BigDecimal totalEarned(UUID referralId) {
        return bookingRepository.sumCommissionByReferralId(referralId).add(billRepository.sumCommissionByReferralId(referralId));
    }

    private ReferralResponse toResponse(Referral referral) {
        BigDecimal totalEarned = totalEarned(referral.getId());
        BigDecimal balanceDue = totalEarned.subtract(referral.getSettledAmount());
        return new ReferralResponse(
                referral.getId().toString(),
                referral.getName(),
                referral.getType(),
                referral.getPhone(),
                referral.getCommissionType(),
                referral.getCommissionValue(),
                referral.isActive(),
                referral.getCreatedAt(),
                totalEarned,
                referral.getSettledAmount(),
                balanceDue
        );
    }
}
