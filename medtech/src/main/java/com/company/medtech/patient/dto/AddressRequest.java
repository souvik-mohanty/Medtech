package com.company.medtech.patient.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressRequest {

    @NotBlank
    private String label;

    @NotBlank
    private String line1;

    private String line2;

    @NotBlank
    private String city;

    @NotBlank
    private String state;

    @NotBlank
    private String pincode;

    @JsonProperty("isDefault")
    private boolean isDefault;
}
