package com.company.medtech.billing.dto;

import com.company.medtech.billing.model.BillSource;
import com.company.medtech.billing.model.PaymentMode;
import com.company.medtech.common.enums.OrderStatus;
import com.company.medtech.payment.dto.PaymentHistoryEntryResponse;
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
    /** Resolved display name for a PATIENT_ONLINE bill — the patient's account name, falling back to their email. Null for a counter sale (see customerName instead). */
    private String patientName;
    /** The ordering patient's mobile number for a PATIENT_ONLINE bill, snapshotted at order time. */
    private String mobileNumber;
    private String addressId;
    private String addressLabel;
    private String addressLine1;
    private String addressLine2;
    private String addressCity;
    private String addressState;
    private String addressPincode;
    private List<BillItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal gstAmount;
    private BigDecimal discountAmount;
    private String couponCode;
    private BigDecimal totalAmount;
    private PaymentMode paymentMode;
    private OrderStatus status;
    private String invoiceNumber;
    private String note;
    private LocalDateTime createdAt;
    /** Only set for a counter sale that credits a referral. */
    private String referralId;
    private String referralName;
    private BigDecimal referralCommission;
    private List<PaymentHistoryEntryResponse> paymentHistory;
}
