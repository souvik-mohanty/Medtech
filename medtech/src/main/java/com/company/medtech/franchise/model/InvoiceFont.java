package com.company.medtech.franchise.model;

/**
 * A closed set of safe font choices for the printed invoice — deliberately
 * not free-form CSS, so a franchise owner can't submit something that breaks
 * PDF rendering. See InvoicePdfService for the actual font-family mapping.
 */
public enum InvoiceFont {
    DEFAULT,
    SERIF,
    MONOSPACE
}
