package com.company.medtech.lab.dto;

import com.company.medtech.common.enums.PaymentStatus;
import com.company.medtech.lab.model.BookingSource;
import com.company.medtech.lab.model.BookingStatus;
import com.company.medtech.lab.model.CollectionMethod;
import com.company.medtech.lab.model.CollectionStatus;
import com.company.medtech.payment.dto.PaymentHistoryEntryResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class LabTestBookingResponse {

    private String id;
    private String patientId;
    private String patientEmail;
    private String patientName;
    /** The walk-in customer's phone for a FRANCHISE_COUNTER booking, or the patient's own profile phone otherwise. */
    private String phone;
    private BookingSource source;
    private String forFamilyMemberId;
    private String forFamilyMemberName;
    private List<LabTestBookingItemResponse> items;
    private String packageId;
    private String packageName;
    private CollectionMethod collectionMethod;
    private String addressId;
    private String addressLabel;
    private String addressLine1;
    private String addressLine2;
    private String addressCity;
    private String addressState;
    private String addressPincode;
    private LocalDate collectionDate;
    private String collectionSlot;
    private CollectionStatus collectionStatus;
    private BookingStatus status;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal collectionCharge;
    private BigDecimal gst;
    private BigDecimal totalAmount;
    private PaymentStatus paymentStatus;
    private BigDecimal amountPaid;
    private String couponCode;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private boolean hasReport;
    /** Only set while hasReport is true — the report is auto-deleted from the server after this date. */
    private LocalDateTime reportExpiresAt;
    /** Only set on owner-entered walk-in bookings. */
    private String referralId;
    private String referralName;
    private BigDecimal referralCommission;
    private List<PaymentHistoryEntryResponse> paymentHistory;
}
