package com.company.medtech.franchise.dto;

import com.company.medtech.franchise.model.InvoiceFont;
import lombok.AllArgsConstructor;
import lombok.Data;

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
    private String invoiceFooterNote;
    private String invoicePrefix;
}
