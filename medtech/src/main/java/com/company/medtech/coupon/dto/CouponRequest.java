package com.company.medtech.coupon.dto;

import com.company.medtech.billing.model.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CouponRequest {

    @NotBlank
    private String code;

    @NotNull
    private DiscountType type;

    @NotNull
    @DecimalMin(value = "0.01", message = "value must be positive")
    private BigDecimal value;

    private String description;

    /** Optional — the smallest order total this coupon can be applied to. */
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal minOrderAmount;

    @NotNull
    @Future(message = "expiresAt must be in the future")
    private LocalDateTime expiresAt;

    /** Optional — how many times this coupon can be redeemed in total, across every customer. */
    @Min(1)
    private Integer usageLimit;
}
