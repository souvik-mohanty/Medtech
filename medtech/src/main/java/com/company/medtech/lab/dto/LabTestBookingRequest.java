package com.company.medtech.lab.dto;

import com.company.medtech.lab.model.CollectionMethod;
import com.company.medtech.payment.model.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/** Exactly one of testIds/packageId must be set — validated in LabTestBookingService. */
@Data
public class LabTestBookingRequest {

    @NotBlank
    private String franchiseId;

    private List<String> testIds;
    private String packageId;

    private String forFamilyMemberId;

    @NotNull
    private CollectionMethod collectionMethod;

    /** Required only when collectionMethod is HOME_COLLECTION — checked in the service. */
    private String addressId;

    @NotNull
    private LocalDate collectionDate;

    /** Required only when collectionMethod is HOME_COLLECTION — a lab visit has no fixed time window. */
    private String collectionSlot;

    private String couponCode;

    @NotNull
    private PaymentMethod paymentMethod;
}
