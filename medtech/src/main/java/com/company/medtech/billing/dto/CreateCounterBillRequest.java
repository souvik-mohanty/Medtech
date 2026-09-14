package com.company.medtech.billing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateCounterBillRequest {

    @NotEmpty
    @Valid
    private List<BillItemRequest> items;

    private String customerName;
    private String customerPhone;
}
