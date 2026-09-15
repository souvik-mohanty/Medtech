package com.company.medtech.lab.dto;

import com.company.medtech.lab.model.TestCategory;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class LabTestResponse {

    private String id;
    private String name;
    private BigDecimal price;
    private boolean active;
    private String code;
    private TestCategory category;
    private String description;
    private String sampleType;
    private String preparationInstructions;
    private int reportTurnaroundHours;
    private boolean prescriptionRequired;
    private BigDecimal gstPercentage;
}
