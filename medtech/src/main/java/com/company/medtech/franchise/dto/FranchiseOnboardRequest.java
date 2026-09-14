package com.company.medtech.franchise.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FranchiseOnboardRequest {

    @NotBlank
    private String name;

    private String gstin;
    private String contactPhone;
    private String contactEmail;
}
