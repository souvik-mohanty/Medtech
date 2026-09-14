package com.company.medtech.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ProductResponse {

    private String id;
    private String name;
    private String unit;
    private BigDecimal price;
    private int stockQuantity;
    private BigDecimal gstPercentage;
}
