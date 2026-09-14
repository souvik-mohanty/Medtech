package com.company.medtech.franchise.dto;

import com.company.medtech.franchise.model.InvoiceFont;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class FranchiseBrandingRequest {

    @NotBlank
    private String name;

    private String gstin;
    private String contactPhone;
    private String contactEmail;

    /** URL of an already-hosted image. File upload isn't built yet — host it elsewhere for now. */
    private String logoUrl;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "accentColorHex must be a hex color like #1F8A70")
    private String accentColorHex;

    private InvoiceFont invoiceFont;
    private String invoiceFooterNote;
    private String invoicePrefix;
}
