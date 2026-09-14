package com.company.medtech.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/** See ProductService#getInsights — powers the shop owner's dashboard. */
@Data
@AllArgsConstructor
public class InventoryInsightsResponse {

    private int totalProducts;
    private long totalStockUnits;
    private BigDecimal totalInventoryValue;

    private int expiringSoonCount;
    private List<ProductResponse> expiringSoon;

    private int expiredCount;
    private List<ProductResponse> expired;
}
