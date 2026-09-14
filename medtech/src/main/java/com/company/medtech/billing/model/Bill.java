package com.company.medtech.billing.model;

import com.company.medtech.common.enums.OrderStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Immutable once created — there is deliberately no update endpoint (see
 * docs/PROJECT_SPEC.md: "Immutability Rule: Once invoice generated → cannot
 * be edited").
 */
@Entity
@Table(name = "bill")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "franchise_id", nullable = false)
    private UUID franchiseId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillSource source;

    // FRANCHISE_COUNTER: staff-entered free text for a walk-in customer.
    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    // PATIENT_ONLINE: the ordering patient's account email.
    @Column(name = "patient_email")
    private String patientEmail;

    /**
     * itemOrder is set explicitly by BillingService (see BillItem#setItemOrder),
     * not managed automatically via @OrderColumn — that relied on Hibernate
     * populating the index column at insert time, which doesn't reliably
     * happen for a brand-new parent+children saved in the same flush
     * (surfaced as a NOT NULL violation on item_order against real Postgres,
     * even though it happened to pass under H2 in tests).
     */
    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("itemOrder")
    private List<BillItem> items = new ArrayList<>();

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(name = "gst_amount", nullable = false)
    private BigDecimal gstAmount;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    /** Resolved rupee amount, computed once at creation from a flat or % input — see BillingService#applyDiscount. */
    @Column(name = "discount_amount", nullable = false)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    /** Optional free-text note printed on the invoice. */
    @Column(name = "note")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = false)
    private PaymentMode paymentMode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    /** Assigned only once payment succeeds — null while PAYMENT_PENDING. */
    @Column(name = "invoice_number")
    private String invoiceNumber;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    /** Only set for a counter sale that credits a referral — snapshotted at bill time, same as lab_test_booking's referral columns. */
    @Column(name = "referral_id")
    private UUID referralId;

    @Column(name = "referral_name")
    private String referralName;

    @Column(name = "referral_commission")
    private BigDecimal referralCommission;

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

    public BillSource getSource() {
        return source;
    }

    public void setSource(BillSource source) {
        this.source = source;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getPatientEmail() {
        return patientEmail;
    }

    public void setPatientEmail(String patientEmail) {
        this.patientEmail = patientEmail;
    }

    public List<BillItem> getItems() {
        return items;
    }

    public void setItems(List<BillItem> items) {
        this.items = items;
    }

    /** Keeps both sides of the relationship in sync. */
    public void addItem(BillItem item) {
        item.setBill(this);
        items.add(item);
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getGstAmount() {
        return gstAmount;
    }

    public void setGstAmount(BigDecimal gstAmount) {
        this.gstAmount = gstAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public PaymentMode getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(PaymentMode paymentMode) {
        this.paymentMode = paymentMode;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public UUID getReferralId() {
        return referralId;
    }

    public void setReferralId(UUID referralId) {
        this.referralId = referralId;
    }

    public String getReferralName() {
        return referralName;
    }

    public void setReferralName(String referralName) {
        this.referralName = referralName;
    }

    public BigDecimal getReferralCommission() {
        return referralCommission;
    }

    public void setReferralCommission(BigDecimal referralCommission) {
        this.referralCommission = referralCommission;
    }
}
