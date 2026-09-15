package com.company.medtech.lab.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

/** A single bookable lab test type, priced by the franchise owner. */
@Entity
@Table(name = "lab_test")
public class LabTest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "franchise_id", nullable = false)
    private UUID franchiseId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private boolean active = true;

    /** No safe backfill for existing rows — nullable at the DB level, uniqueness enforced in LabTestService for new tests only. */
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TestCategory category = TestCategory.ROUTINE_HEALTH;

    private String description;

    @Column(name = "sample_type")
    private String sampleType;

    @Column(name = "preparation_instructions")
    private String preparationInstructions;

    @Column(name = "report_turnaround_hours", nullable = false)
    private int reportTurnaroundHours = 24;

    @Column(name = "prescription_required", nullable = false)
    private boolean prescriptionRequired;

    /** Optional per-test GST rate (percent, e.g. 5 = 5%) — defaults to 0, not the old hardcoded flat 5% every booking used to charge. */
    @Column(name = "gst_percentage", nullable = false)
    private BigDecimal gstPercentage = BigDecimal.ZERO;

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

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public TestCategory getCategory() {
        return category;
    }

    public void setCategory(TestCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSampleType() {
        return sampleType;
    }

    public void setSampleType(String sampleType) {
        this.sampleType = sampleType;
    }

    public String getPreparationInstructions() {
        return preparationInstructions;
    }

    public void setPreparationInstructions(String preparationInstructions) {
        this.preparationInstructions = preparationInstructions;
    }

    public int getReportTurnaroundHours() {
        return reportTurnaroundHours;
    }

    public void setReportTurnaroundHours(int reportTurnaroundHours) {
        this.reportTurnaroundHours = reportTurnaroundHours;
    }

    public boolean isPrescriptionRequired() {
        return prescriptionRequired;
    }

    public void setPrescriptionRequired(boolean prescriptionRequired) {
        this.prescriptionRequired = prescriptionRequired;
    }

    public BigDecimal getGstPercentage() {
        return gstPercentage;
    }

    public void setGstPercentage(BigDecimal gstPercentage) {
        this.gstPercentage = gstPercentage;
    }
}
