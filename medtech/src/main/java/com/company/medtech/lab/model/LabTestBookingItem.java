package com.company.medtech.lab.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * A package purchase expands into one of these per constituent test at
 * booking time — the package itself is booking-level metadata
 * (LabTestBooking#packageId/packageName), not a per-item choice. name/
 * amount are snapshots, same idea as bill_item, so a later catalog edit
 * never changes a past booking.
 */
@Entity
@Table(name = "lab_test_booking_item")
public class LabTestBookingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(name = "lab_test_id")
    private UUID labTestId;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "item_order", nullable = false)
    private int itemOrder;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }

    public UUID getLabTestId() {
        return labTestId;
    }

    public void setLabTestId(UUID labTestId) {
        this.labTestId = labTestId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public int getItemOrder() {
        return itemOrder;
    }

    public void setItemOrder(int itemOrder) {
        this.itemOrder = itemOrder;
    }
}
