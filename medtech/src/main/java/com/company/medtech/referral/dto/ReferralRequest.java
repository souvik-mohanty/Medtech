package com.company.medtech.referral.dto;

import com.company.medtech.referral.model.CommissionType;
import com.company.medtech.referral.model.ReferralType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ReferralRequest {

    @NotBlank
    private String name;

    @NotNull
    private ReferralType type;

    private String phone;

    @NotNull
    private CommissionType commissionType;

    @NotNull
    @DecimalMin(value = "0", message = "commissionValue cannot be negative")
    private BigDecimal commissionValue;
}
