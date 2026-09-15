package com.company.medtech.billing.dto;

import com.company.medtech.billing.model.PaymentMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateOnlineOrderRequest {

    @NotBlank
    private String franchiseId;

    @NotEmpty
    @Valid
    private List<BillItemRequest> items;

    /** CASH is always accepted; ONLINE requires the franchise to have an active payment gateway. */
    @NotNull
    private PaymentMode paymentMode;

    @NotBlank
    private String mobileNumber;

    /** One of the patient's own saved addresses (see patient/PatientAddressController) — required so the owner can actually deliver the order. */
    @NotBlank
    private String addressId;
}
