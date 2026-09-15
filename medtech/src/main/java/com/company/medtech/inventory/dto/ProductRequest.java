package com.company.medtech.inventory.dto;

import com.company.medtech.inventory.model.SalesChannel;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProductRequest {

    @NotBlank
    private String name;

    private String unit;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal sellingPrice;

    /** Cost price — mandatory, used for inventory valuation insights. */
    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal purchasePrice;

    private LocalDate mfgDate;

    /** Defaults to today client-side; the shop owner can change it. */
    private LocalDate purchaseDate;

    /** Optional — who this stock was bought from. */
    private String supplier;

    /** Optional — powers the dashboard's expiring-soon/expired insight. */
    private LocalDate expiryDate;

    @NotNull
    @Min(0)
    private Integer stockQuantity;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal gstPercentage;

    private boolean prescriptionRequired;

    /** Where this product is offered — defaults to BOTH if omitted. */
    private SalesChannel salesChannel;
}
