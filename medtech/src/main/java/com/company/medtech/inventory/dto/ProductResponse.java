package com.company.medtech.inventory.dto;

import com.company.medtech.inventory.model.SalesChannel;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
public class ProductResponse {

    private String id;
    private String name;
    private String unit;
    private BigDecimal sellingPrice;
    private BigDecimal purchasePrice;
    private LocalDate mfgDate;
    private LocalDate purchaseDate;
    private String supplier;
    private LocalDate expiryDate;
    private int stockQuantity;
    private BigDecimal gstPercentage;
    private boolean prescriptionRequired;
    private boolean active;
    private SalesChannel salesChannel;
}
