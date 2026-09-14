package com.company.medtech.lab.model;

import com.company.medtech.common.enums.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A patient's booking of one or more individual tests, or a package
 * (packageId set) that itself expanded into {@link LabTestBookingItem}
 * rows at booking time — see LabTestBookingService#bookTest. Money fields
 * (subtotal/discount/collectionCharge/gst/totalAmount) are computed and
 * owned by the backend, never trusted from the client.
 */
@Entity
@Table(name = "lab_test_booking")
public class LabTestBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "franchise_id", nullable = false)
    private UUID franchiseId;

    /** Null for a walk-in booking (see customerName/customerPhone/source below). */
    @Column(name = "patient_email")
    private String patientEmail;

    /** Set only for a FRANCHISE_COUNTER (walk-in) booking — a walk-in has no patient account to look up a name from. */
    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingSource source = BookingSource.PATIENT_ONLINE;

    /** Set only when this booking came from selecting a package rather than individual tests. */
    @Column(name = "package_id")
    private UUID packageId;

    @Column(name = "package_name")
    private String packageName;

    @Column(name = "for_family_member_id")
    private UUID forFamilyMemberId;

    @Column(name = "for_family_member_name")
    private String forFamilyMemberName;

    @Enumerated(EnumType.STRING)
    @Column(name = "collection_method", nullable = false)
    private CollectionMethod collectionMethod = CollectionMethod.LAB_VISIT;

    @Column(name = "address_id")
    private UUID addressId;

    @Column(name = "address_label")
    private String addressLabel;

    @Column(name = "address_line1")
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    @Column(name = "address_city")
    private String addressCity;

    @Column(name = "address_state")
    private String addressState;

    @Column(name = "address_pincode")
    private String addressPincode;

    @Column(name = "collection_date")
    private LocalDate collectionDate;

    @Column(name = "collection_slot")
    private String collectionSlot;

    @Enumerated(EnumType.STRING)
    @Column(name = "collection_status", nullable = false)
    private CollectionStatus collectionStatus = CollectionStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(nullable = false)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "collection_charge", nullable = false)
    private BigDecimal collectionCharge = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal gst;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "coupon_code")
    private String couponCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    /** How much of totalAmount has actually been collected so far — see PaymentStatus.PARTIALLY_PAID. */
    @Column(name = "amount_paid", nullable = false)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    /** Only set on owner-entered walk-in bookings — see LabTestBookingService#createWalkInBooking. Snapshotted at booking time. */
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

    public String getPatientEmail() {
        return patientEmail;
    }

    public void setPatientEmail(String patientEmail) {
        this.patientEmail = patientEmail;
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

    public BookingSource getSource() {
        return source;
    }

    public void setSource(BookingSource source) {
        this.source = source;
    }

    public UUID getPackageId() {
        return packageId;
    }

    public void setPackageId(UUID packageId) {
        this.packageId = packageId;
    }

    public String getPackageName() {
        return packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    public UUID getForFamilyMemberId() {
        return forFamilyMemberId;
    }

    public void setForFamilyMemberId(UUID forFamilyMemberId) {
        this.forFamilyMemberId = forFamilyMemberId;
    }

    public String getForFamilyMemberName() {
        return forFamilyMemberName;
    }

    public void setForFamilyMemberName(String forFamilyMemberName) {
        this.forFamilyMemberName = forFamilyMemberName;
    }

    public CollectionMethod getCollectionMethod() {
        return collectionMethod;
    }

    public void setCollectionMethod(CollectionMethod collectionMethod) {
        this.collectionMethod = collectionMethod;
    }

    public UUID getAddressId() {
        return addressId;
    }

    public void setAddressId(UUID addressId) {
        this.addressId = addressId;
    }

    public String getAddressLabel() {
        return addressLabel;
    }

    public void setAddressLabel(String addressLabel) {
        this.addressLabel = addressLabel;
    }

    public String getAddressLine1() {
        return addressLine1;
    }

    public void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
    }

    public String getAddressLine2() {
        return addressLine2;
    }

    public void setAddressLine2(String addressLine2) {
        this.addressLine2 = addressLine2;
    }

    public String getAddressCity() {
        return addressCity;
    }

    public void setAddressCity(String addressCity) {
        this.addressCity = addressCity;
    }

    public String getAddressState() {
        return addressState;
    }

    public void setAddressState(String addressState) {
        this.addressState = addressState;
    }

    public String getAddressPincode() {
        return addressPincode;
    }

    public void setAddressPincode(String addressPincode) {
        this.addressPincode = addressPincode;
    }

    public LocalDate getCollectionDate() {
        return collectionDate;
    }

    public void setCollectionDate(LocalDate collectionDate) {
        this.collectionDate = collectionDate;
    }

    public String getCollectionSlot() {
        return collectionSlot;
    }

    public void setCollectionSlot(String collectionSlot) {
        this.collectionSlot = collectionSlot;
    }

    public CollectionStatus getCollectionStatus() {
        return collectionStatus;
    }

    public void setCollectionStatus(CollectionStatus collectionStatus) {
        this.collectionStatus = collectionStatus;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getDiscount() {
        return discount;
    }

    public void setDiscount(BigDecimal discount) {
        this.discount = discount;
    }

    public BigDecimal getCollectionCharge() {
        return collectionCharge;
    }

    public void setCollectionCharge(BigDecimal collectionCharge) {
        this.collectionCharge = collectionCharge;
    }

    public BigDecimal getGst() {
        return gst;
    }

    public void setGst(BigDecimal gst) {
        this.gst = gst;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getCouponCode() {
        return couponCode;
    }

    public void setCouponCode(String couponCode) {
        this.couponCode = couponCode;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
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
