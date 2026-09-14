package com.company.medtech.billing.dto;

import com.company.medtech.billing.model.BillSource;
import com.company.medtech.billing.model.PaymentMode;
import com.company.medtech.common.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class BillResponse {

    private String id;
    private String franchiseId;
    private BillSource source;
    private String customerName;
    private String customerPhone;
    private String patientEmail;
    private List<BillItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal gstAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private PaymentMode paymentMode;
    private OrderStatus status;
    private String invoiceNumber;
    private String note;
    private LocalDateTime createdAt;
}
