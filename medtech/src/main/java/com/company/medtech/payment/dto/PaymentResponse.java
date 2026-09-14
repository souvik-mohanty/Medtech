package com.company.medtech.payment.dto;

import com.company.medtech.common.enums.PaymentStatus;
import com.company.medtech.payment.model.PaymentMethod;
import com.company.medtech.payment.model.RefundStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class PaymentResponse {

    private String id;
    private String bookingId;
    private String patientName;
    private BigDecimal amount;
    private BigDecimal amountPaid;
    private PaymentMethod method;
    private PaymentStatus status;
    private RefundStatus refundStatus;
    private LocalDateTime createdAt;
}
