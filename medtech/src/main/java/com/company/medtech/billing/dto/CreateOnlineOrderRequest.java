package com.company.medtech.billing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateOnlineOrderRequest {

    @NotBlank
    private String franchiseId;

    @NotEmpty
    @Valid
    private List<BillItemRequest> items;
}
