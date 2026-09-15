package com.company.medtech.lab.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class LabTestBookingItemResponse {

    private String testId;
    private String testName;
    private BigDecimal price;
    private BigDecimal gstPercentage;
}
