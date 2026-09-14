package com.company.medtech.inventory.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "product")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "franchise_id", nullable = false)
    private UUID franchiseId;

    @Column(nullable = false)
    private String name;

    /** e.g. "strip", "bottle", "box". Free text, kept simple for now. */
    private String unit;

    @Column(name = "selling_price", nullable = false)
    private BigDecimal sellingPrice;

    /** Cost price — optional, used for inventory valuation insights. */
    @Column(name = "purchase_price")
    private BigDecimal purchasePrice;

    @Column(name = "mfg_date")
    private LocalDate mfgDate;

    /** When this stock was bought from the supplier. Defaults to today client-side, editable. */
    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    /** Optional — see ProductService#getInsights for expiring-soon/expired bucketing. */
    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity;

    /** e.g. 12.00 for 12%. Zero (GST-exempt) unless the franchise sets it. */
    @Column(name = "gst_percentage", nullable = false)
    private BigDecimal gstPercentage = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "prescription_required", nullable = false)
    private boolean prescriptionRequired = false;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getFranchiseId() {
        return franchiseId;
    }

    public void setFranchiseId(UUID franchiseId) {
        this.franchiseId = franchiseId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }

    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
    }

    public BigDecimal getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(BigDecimal purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public LocalDate getMfgDate() {
        return mfgDate;
    }

    public void setMfgDate(LocalDate mfgDate) {
        this.mfgDate = mfgDate;
    }

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public BigDecimal getGstPercentage() {
        return gstPercentage;
    }

    public void setGstPercentage(BigDecimal gstPercentage) {
        this.gstPercentage = gstPercentage;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isPrescriptionRequired() {
        return prescriptionRequired;
    }

    public void setPrescriptionRequired(boolean prescriptionRequired) {
        this.prescriptionRequired = prescriptionRequired;
    }
}
