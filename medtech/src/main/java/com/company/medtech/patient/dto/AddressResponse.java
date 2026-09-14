package com.company.medtech.patient.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AddressResponse {

    private String id;
    private String label;
    private String line1;
    private String line2;
    private String city;
    private String state;
    private String pincode;

    @JsonProperty("isDefault")
    private boolean isDefault;
}
