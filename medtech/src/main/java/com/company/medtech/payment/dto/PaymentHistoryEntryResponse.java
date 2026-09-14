package com.company.medtech.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class PaymentHistoryEntryResponse {

    private BigDecimal amount;
    private LocalDateTime recordedAt;
}
