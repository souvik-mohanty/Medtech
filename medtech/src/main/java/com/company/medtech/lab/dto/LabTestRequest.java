package com.company.medtech.lab.dto;

import com.company.medtech.lab.model.TestCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LabTestRequest {

    @NotBlank
    private String name;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal price;

    private String code;

    @NotNull
    private TestCategory category;

    private String description;
    private String sampleType;
    private String preparationInstructions;

    @NotNull
    private Integer reportTurnaroundHours;

    private boolean prescriptionRequired;

    /** Optional — GST percent (e.g. 5 for 5%). Null/omitted means 0, no tax. */
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal gstPercentage;
}
