package com.company.medtech.franchise.dto;

import com.company.medtech.franchise.model.InvoiceFont;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Returned once, right after a Patient self-onboards into a Franchise (shop
 * owner) account. Carries a freshly minted JWT with role FRANCHISE, since
 * the caller's existing token (minted at login) still says PATIENT — see
 * FranchiseService#onboard.
 */
@Data
@AllArgsConstructor
public class FranchiseOnboardResponse {

    private String id;
    private String name;
    private String gstin;
    private String contactPhone;
    private String contactEmail;
    private String logoUrl;
    private String accentColorHex;
    private InvoiceFont invoiceFont;
    private String invoiceFooterNote;
    private String invoicePrefix;
    private String token;
    private String role;
}
