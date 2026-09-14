package com.company.medtech.referral.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/** Records a commission payout to a referral, on top of whatever's already been settled. */
@Data
public class SettleReferralRequest {

    @NotNull
    @DecimalMin(value = "0.01", message = "amount must be positive")
    private BigDecimal amount;
}
