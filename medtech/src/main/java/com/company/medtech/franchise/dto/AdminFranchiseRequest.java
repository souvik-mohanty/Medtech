package com.company.medtech.franchise.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminFranchiseRequest {

    @NotBlank
    @Email
    private String ownerEmail;

    @NotBlank
    private String name;

    private String gstin;
    private String contactPhone;
    private String contactEmail;
}
