package com.company.medtech.franchise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminFranchiseResponse {

    private String id;
    private String ownerEmail;
    private String name;
    private String gstin;
    private String contactPhone;
    private String contactEmail;
    private boolean active;
}
