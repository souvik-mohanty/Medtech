package com.company.medtech.franchise.dto;

import com.company.medtech.franchise.model.InvoiceFont;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

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
    private String invoiceHeaderNote;
    private String invoiceFooterNote;
    private String invoicePrefix;

    /** Charged on HOME_COLLECTION bookings below freeCollectionMinOrder (or always, if that's unset). */
    @NotNull
    @DecimalMin(value = "0", message = "collectionCharge cannot be negative")
    private BigDecimal collectionCharge;

    /** Subtotal at/above which the collection charge is waived. Null = no free threshold, always charge. */
    @DecimalMin(value = "0", message = "freeCollectionMinOrder cannot be negative")
    private BigDecimal freeCollectionMinOrder;

    /** Null = leave unchanged. Replaces the whole set — see FranchiseService#updateBranding. */
    private List<String> serviceablePincodes;
}
