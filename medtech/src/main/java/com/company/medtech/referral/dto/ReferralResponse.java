package com.company.medtech.referral.dto;

import com.company.medtech.referral.model.CommissionType;
import com.company.medtech.referral.model.ReferralType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ReferralResponse {

    private String id;
    private String name;
    private ReferralType type;
    private String phone;
    private CommissionType commissionType;
    private BigDecimal commissionValue;
    private boolean active;
    private LocalDateTime createdAt;
    /** Sum of referral_commission across every booking/bill this referral is credited on — always computed live. */
    private BigDecimal totalEarned;
    private BigDecimal settledAmount;
    private BigDecimal balanceDue;
}
