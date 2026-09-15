package com.company.medtech.coupon.service;

import com.company.medtech.billing.model.DiscountType;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.coupon.dto.CouponRequest;
import com.company.medtech.coupon.dto.CouponResponse;
import com.company.medtech.coupon.model.Coupon;
import com.company.medtech.coupon.repository.CouponRepository;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class CouponServiceTest {

    @Autowired
    private CouponService couponService;

    @Autowired
    private FranchiseRepository franchiseRepository;

    @Autowired
    private CouponRepository couponRepository;

    private Franchise franchise;

    @BeforeEach
    void setUp() {
        franchise = new Franchise();
        franchise.setOwnerEmail("owner-" + UUID.randomUUID() + "@example.com");
        franchise.setName("Test Pharmacy");
        franchise = franchiseRepository.save(franchise);
    }

    @Test
    void createsAFlatCouponAndUppercasesTheCode() {
        CouponResponse coupon = couponService.create(franchise.getOwnerEmail(), request("welcome10", DiscountType.FLAT, new BigDecimal("50")));

        assertThat(coupon.getCode()).isEqualTo("WELCOME10");
        assertThat(coupon.isActive()).isTrue();
        assertThat(coupon.getUsageCount()).isZero();
    }

    @Test
    void rejectsADuplicateCodeForTheSameFranchise() {
        couponService.create(franchise.getOwnerEmail(), request("DUPE10", DiscountType.FLAT, new BigDecimal("50")));

        assertThatThrownBy(() -> couponService.create(franchise.getOwnerEmail(), request("dupe10", DiscountType.FLAT, new BigDecimal("20"))))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void toggleActiveFlipsTheFlag() {
        CouponResponse coupon = couponService.create(franchise.getOwnerEmail(), request("TOGGLE10", DiscountType.FLAT, new BigDecimal("50")));

        CouponResponse toggled = couponService.toggleActive(franchise.getOwnerEmail(), coupon.getId());

        assertThat(toggled.isActive()).isFalse();
    }

    @Test
    void validateRejectsAnExpiredCoupon() {
        // CouponRequest requires a future expiresAt (@Future), so an already-expired
        // coupon can only exist via direct persistence — e.g. one that expired after creation.
        Coupon coupon = new Coupon();
        coupon.setFranchiseId(franchise.getId());
        coupon.setCode("EXPIRED10");
        coupon.setType(DiscountType.FLAT);
        coupon.setValue(new BigDecimal("50"));
        coupon.setExpiresAt(LocalDateTime.now().minusDays(1));
        coupon.setActive(true);
        coupon.setCreatedAt(LocalDateTime.now());
        couponRepository.save(coupon);

        assertThatThrownBy(() -> couponService.validate(franchise.getId().toString(), "EXPIRED10", BigDecimal.TEN))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("expired");
    }

    @Test
    void validateRejectsBelowMinimumOrderAmount() {
        CouponRequest request = request("MIN500", DiscountType.FLAT, new BigDecimal("50"));
        request.setMinOrderAmount(new BigDecimal("500"));
        couponService.create(franchise.getOwnerEmail(), request);

        assertThatThrownBy(() -> couponService.validate(franchise.getId().toString(), "MIN500", new BigDecimal("100")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("minimum order");
    }

    @Test
    void validateRejectsAnUnknownCode() {
        assertThatThrownBy(() -> couponService.validate(franchise.getId().toString(), "NOPE", BigDecimal.TEN))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("doesn't exist");
    }

    @Test
    void redeemAppliesAPercentageDiscountCappedAtTheOrderAmountAndIncrementsUsage() {
        CouponRequest request = request("BIG90", DiscountType.PERCENTAGE, new BigDecimal("90"));
        CouponResponse coupon = couponService.create(franchise.getOwnerEmail(), request);

        BigDecimal discount = couponService.redeem(franchise.getId(), "BIG90", new BigDecimal("100"));

        assertThat(discount).isEqualByComparingTo(new BigDecimal("90.00"));
        assertThat(couponService.listForFranchise(franchise.getOwnerEmail()))
                .filteredOn(c -> c.getId().equals(coupon.getId()))
                .first()
                .satisfies(c -> assertThat(c.getUsageCount()).isEqualTo(1));
    }

    @Test
    void redeemNeverDiscountsMoreThanTheOrderTotal() {
        couponService.create(franchise.getOwnerEmail(), request("HUGEFLAT", DiscountType.FLAT, new BigDecimal("500")));

        BigDecimal discount = couponService.redeem(franchise.getId(), "HUGEFLAT", new BigDecimal("100"));

        assertThat(discount).isEqualByComparingTo(new BigDecimal("100"));
    }

    @Test
    void redeemRefusesOnceTheUsageLimitIsReached() {
        CouponRequest request = request("ONCE", DiscountType.FLAT, new BigDecimal("10"));
        request.setUsageLimit(1);
        couponService.create(franchise.getOwnerEmail(), request);

        couponService.redeem(franchise.getId(), "ONCE", new BigDecimal("100"));

        assertThatThrownBy(() -> couponService.redeem(franchise.getId(), "ONCE", new BigDecimal("100")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("usage limit");
    }

    @Test
    void redeemRefusesADeactivatedCoupon() {
        CouponResponse coupon = couponService.create(franchise.getOwnerEmail(), request("OFF10", DiscountType.FLAT, new BigDecimal("10")));
        couponService.toggleActive(franchise.getOwnerEmail(), coupon.getId());

        assertThatThrownBy(() -> couponService.redeem(franchise.getId(), "OFF10", new BigDecimal("100")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("no longer active");
    }

    private CouponRequest request(String code, DiscountType type, BigDecimal value) {
        CouponRequest request = new CouponRequest();
        request.setCode(code);
        request.setType(type);
        request.setValue(value);
        request.setDescription("Test coupon");
        request.setExpiresAt(LocalDateTime.now().plusDays(30));
        return request;
    }
}
