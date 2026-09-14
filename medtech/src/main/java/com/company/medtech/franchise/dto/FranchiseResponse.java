package com.company.medtech.franchise.dto;

import com.company.medtech.franchise.model.InvoiceFont;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class FranchiseResponse {

    private String id;
    private String name;
    private String gstin;
    private String contactPhone;
    private String contactEmail;
    private String logoUrl;
    private String accentColorHex;
    private InvoiceFont invoiceFont;
    private String invoiceHeaderNote;
    private String invoiceFooterNote;
    private String invoicePrefix;
    private BigDecimal collectionCharge;
    private BigDecimal freeCollectionMinOrder;
    /** Empty = no restriction configured, every pincode is servable. */
    private List<String> serviceablePincodes;
}
