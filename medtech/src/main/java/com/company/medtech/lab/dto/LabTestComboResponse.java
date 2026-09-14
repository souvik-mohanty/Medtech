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
    /** Derived — sum of the constituent tests' current prices, computed at read time. */
    private BigDecimal totalPrice;
    private boolean active;
    private List<LabTestResponse> tests;
    private String description;
    private String preparationInstructions;
    private int reportTurnaroundHours;
}
