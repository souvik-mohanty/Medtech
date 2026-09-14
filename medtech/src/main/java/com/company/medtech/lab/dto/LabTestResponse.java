package com.company.medtech.lab.dto;

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
}
