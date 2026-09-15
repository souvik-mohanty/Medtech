package com.company.medtech.coupon.dto;

import com.company.medtech.billing.model.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class CouponResponse {

    private String id;
    private String code;
    private DiscountType type;
    private BigDecimal value;
    private String description;
    private BigDecimal minOrderAmount;
    private LocalDateTime expiresAt;
    private boolean active;
    private Integer usageLimit;
    private int usageCount;
}
