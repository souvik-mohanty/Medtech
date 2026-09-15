package com.company.medtech.coupon.service;

import com.company.medtech.billing.model.DiscountType;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.coupon.dto.CouponRequest;
import com.company.medtech.coupon.dto.CouponResponse;
import com.company.medtech.coupon.model.Coupon;
import com.company.medtech.coupon.repository.CouponRepository;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CouponService {

    private final CouponRepository couponRepository;
    private final FranchiseService franchiseService;

    public CouponService(CouponRepository couponRepository, FranchiseService franchiseService) {
        this.couponRepository = couponRepository;
        this.franchiseService = franchiseService;
    }

    public List<CouponResponse> listForFranchise(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return couponRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId()).stream().map(this::toResponse).toList();
    }

    public CouponResponse create(String ownerEmail, CouponRequest request) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);

        String code = request.getCode().trim().toUpperCase();
        if (couponRepository.findByFranchiseIdAndCodeIgnoreCase(franchise.getId(), code).isPresent()) {
            throw new BusinessException("A coupon with this code already exists");
        }

        Coupon coupon = new Coupon();
        coupon.setFranchiseId(franchise.getId());
        coupon.setCode(code);
        coupon.setType(request.getType());
        coupon.setValue(request.getValue());
        coupon.setDescription(request.getDescription());
        coupon.setMinOrderAmount(request.getMinOrderAmount());
        coupon.setExpiresAt(request.getExpiresAt());
        coupon.setUsageLimit(request.getUsageLimit());
        coupon.setActive(true);
        coupon.setUsageCount(0);
        coupon.setCreatedAt(LocalDateTime.now());

        return toResponse(couponRepository.save(coupon));
    }

    public CouponResponse toggleActive(String ownerEmail, String id) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        Coupon coupon = couponRepository.findByIdAndFranchiseId(parseId(id, "Coupon"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        coupon.setActive(!coupon.isActive());
        return toResponse(couponRepository.save(coupon));
    }

    /** Read-only check — used by the patient checkout/booking flow to preview a code before it's actually applied. */
    @Transactional(readOnly = true)
    public CouponResponse validate(String franchiseId, String code, BigDecimal orderAmount) {
        Coupon coupon = couponRepository.findByFranchiseIdAndCodeIgnoreCase(parseId(franchiseId, "Franchise"), code)
                .orElseThrow(() -> new BusinessException("This coupon code doesn't exist."));
        assertRedeemable(coupon, orderAmount);
        return toResponse(coupon);
    }

    /**
     * Actually applies a coupon at bill/booking creation time: re-validates
     * under a row lock (so two concurrent redemptions can't both slip past a
     * usage-limit check) and increments usageCount. Returns the resolved
     * discount amount — callers should trust this, not any discount value
     * the client itself sent, since a coupon's real type/value lives here.
     */
    @Transactional
    public BigDecimal redeem(UUID franchiseId, String code, BigDecimal orderAmount) {
        Coupon coupon = couponRepository.findByFranchiseIdAndCodeIgnoreCaseForUpdate(franchiseId, code)
                .orElseThrow(() -> new BusinessException("This coupon code doesn't exist."));
        assertRedeemable(coupon, orderAmount);

        coupon.setUsageCount(coupon.getUsageCount() + 1);
        couponRepository.save(coupon);

        return resolveDiscount(coupon, orderAmount);
    }

    private void assertRedeemable(Coupon coupon, BigDecimal orderAmount) {
        if (!coupon.isActive()) {
            throw new BusinessException("This coupon is no longer active.");
        }
        if (coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("This coupon has expired.");
        }
        if (coupon.getMinOrderAmount() != null && orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new BusinessException("This coupon requires a minimum order of ₹" + coupon.getMinOrderAmount());
        }
        if (coupon.getUsageLimit() != null && coupon.getUsageCount() >= coupon.getUsageLimit()) {
            throw new BusinessException("This coupon has reached its usage limit.");
        }
    }

    private BigDecimal resolveDiscount(Coupon coupon, BigDecimal orderAmount) {
        BigDecimal discount = coupon.getType() == DiscountType.PERCENTAGE
                ? orderAmount.multiply(coupon.getValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : coupon.getValue();
        return discount.compareTo(orderAmount) > 0 ? orderAmount : discount;
    }

    private UUID parseId(String id, String resourceName) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException(resourceName, "id", id);
        }
    }

    private CouponResponse toResponse(Coupon coupon) {
        return new CouponResponse(
                coupon.getId().toString(),
                coupon.getCode(),
                coupon.getType(),
                coupon.getValue(),
                coupon.getDescription(),
                coupon.getMinOrderAmount(),
                coupon.getExpiresAt(),
                coupon.isActive(),
                coupon.getUsageLimit(),
                coupon.getUsageCount()
        );
    }
}
