package com.company.medtech.franchise.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

/**
 * Provisioned directly in Postgres — there is no self-service or admin
 * onboarding endpoint (see CLAUDE.md). {@code ownerEmail} matches the
 * {@code email} of the UserAuth row with {@code role = 'FRANCHISE'}.
 */
@Entity
@Table(name = "franchise")
public class Franchise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_email", nullable = false, unique = true)
    private String ownerEmail;

    private String name;
    private String gstin;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "contact_email")
    private String contactEmail;

    // Structured invoice branding — see InvoiceFont for why this isn't raw HTML/CSS.
    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "accent_color_hex", nullable = false)
    private String accentColorHex = "#1F8A70";

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_font", nullable = false)
    private InvoiceFont invoiceFont = InvoiceFont.DEFAULT;

    @Column(name = "invoice_footer_note")
    private String invoiceFooterNote;

    /** Short code prefixed to invoice numbers, e.g. "MTC". Falls back to the id if unset. */
    @Column(name = "invoice_prefix")
    private String invoicePrefix;

    /** Atomically incremented per invoice generated — see BillingService#nextInvoiceNumber. */
    @Column(name = "invoice_sequence", nullable = false)
    private long invoiceSequence = 0;

    @Embedded
    private PaymentGatewayConfig paymentGateway = new PaymentGatewayConfig();

    @Column(nullable = false)
    private boolean active = true;

    /** If false, this franchise cannot accept online payment — every sale must be cash. */
    public boolean hasActivePaymentGateway() {
        return paymentGateway != null
                && paymentGateway.isActive()
                && paymentGateway.getProvider() != PaymentProvider.NONE
                && paymentGateway.getApiKey() != null && !paymentGateway.getApiKey().isBlank()
                && paymentGateway.getEncryptedApiSecret() != null && !paymentGateway.getEncryptedApiSecret().isBlank();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGstin() {
        return gstin;
    }

    public void setGstin(String gstin) {
        this.gstin = gstin;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getAccentColorHex() {
        return accentColorHex;
    }

    public void setAccentColorHex(String accentColorHex) {
        this.accentColorHex = accentColorHex;
    }

    public InvoiceFont getInvoiceFont() {
        return invoiceFont;
    }

    public void setInvoiceFont(InvoiceFont invoiceFont) {
        this.invoiceFont = invoiceFont;
    }

    public String getInvoiceFooterNote() {
        return invoiceFooterNote;
    }

    public void setInvoiceFooterNote(String invoiceFooterNote) {
        this.invoiceFooterNote = invoiceFooterNote;
    }

    public String getInvoicePrefix() {
        return invoicePrefix;
    }

    public void setInvoicePrefix(String invoicePrefix) {
        this.invoicePrefix = invoicePrefix;
    }

    public long getInvoiceSequence() {
        return invoiceSequence;
    }

    public void setInvoiceSequence(long invoiceSequence) {
        this.invoiceSequence = invoiceSequence;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public PaymentGatewayConfig getPaymentGateway() {
        return paymentGateway;
    }

    public void setPaymentGateway(PaymentGatewayConfig paymentGateway) {
        this.paymentGateway = paymentGateway;
    }
}
