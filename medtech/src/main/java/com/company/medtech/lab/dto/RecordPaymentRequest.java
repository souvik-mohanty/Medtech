package com.company.medtech.lab.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/** Records an additional payment collected towards a booking (on top of whatever's already been paid). */
@Data
public class RecordPaymentRequest {

    @NotNull
    @DecimalMin(value = "0.01", message = "amount must be positive")
    private BigDecimal amount;
}
