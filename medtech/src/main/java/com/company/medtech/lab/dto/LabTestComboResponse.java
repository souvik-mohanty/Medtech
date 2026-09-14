package com.company.medtech.lab.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class LabTestComboResponse {

    private String id;
    private String name;
    private BigDecimal comboPrice;
    private boolean active;
    private List<LabTestResponse> tests;
}
