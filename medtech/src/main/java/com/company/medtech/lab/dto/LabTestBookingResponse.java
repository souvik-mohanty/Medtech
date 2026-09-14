package com.company.medtech.lab.dto;

import com.company.medtech.billing.model.PaymentMode;
import com.company.medtech.common.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class LabTestBookingResponse {

    private String id;
    private String patientEmail;
    private String itemName;
    private BigDecimal amount;
    private String address;
    private String mobileNumber;
    private PaymentMode paymentMode;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
}
