package com.company.medtech.billing.service;

import com.company.medtech.billing.model.Bill;
import com.company.medtech.billing.model.BillItem;
import com.company.medtech.billing.model.BillSource;
import com.company.medtech.billing.model.PaymentMode;
import com.company.medtech.common.enums.OrderStatus;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.model.InvoiceFont;
import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Exercises the actual Thymeleaf template + OpenHTMLtoPDF conversion — the
 * riskiest new code in the billing module — without needing a full Spring
 * Boot context or a running database.
 */
class InvoicePdfServiceTest {

    @Test
    void rendersAWellFormedPdfWithBrandingAndLineItems() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCacheable(false);

        SpringTemplateEngine templateEngine = new SpringTemplateEngine();
        templateEngine.setTemplateResolver(resolver);

        InvoicePdfService service = new InvoicePdfService(templateEngine);

        Franchise franchise = new Franchise();
        franchise.setId(UUID.randomUUID());
        franchise.setName("Test Pharmacy & Clinic");
        franchise.setGstin("29ABCDE1234F1Z5");
        franchise.setContactPhone("+91 90000 00000");
        franchise.setContactEmail("contact@testpharmacy.example");
        franchise.setLogoUrl(null); // no logo set — template must tolerate this
        franchise.setAccentColorHex("#1F8A70");
        franchise.setInvoiceFont(InvoiceFont.SERIF);
        franchise.setInvoiceFooterNote("Thank you for your purchase!");

        BillItem item1 = new BillItem();
        item1.setProductId(UUID.randomUUID());
        item1.setProductName("Paracetamol 500mg");
        item1.setUnitPrice(new BigDecimal("25.00"));
        item1.setQuantity(2);
        item1.setGstPercentage(new BigDecimal("12.00"));
        item1.setLineSubtotal(new BigDecimal("50.00"));
        item1.setLineGstAmount(new BigDecimal("6.00"));
        item1.setLineTotal(new BigDecimal("56.00"));

        Bill bill = new Bill();
        bill.setId(UUID.randomUUID());
        bill.setFranchiseId(franchise.getId());
        bill.setSource(BillSource.FRANCHISE_COUNTER);
        bill.setCustomerName("Walk-in Customer");
        bill.setCustomerPhone("9999999999");
        bill.setItems(List.of(item1));
        bill.setSubtotal(new BigDecimal("50.00"));
        bill.setGstAmount(new BigDecimal("6.00"));
        bill.setTotalAmount(new BigDecimal("56.00"));
        bill.setPaymentMode(PaymentMode.CASH);
        bill.setStatus(OrderStatus.PAID);
        bill.setInvoiceNumber("TEST-000001");
        bill.setCreatedAt(LocalDateTime.now());
        bill.setPaidAt(LocalDateTime.now());

        byte[] pdfBytes = service.render(franchise, bill);

        assertThat(pdfBytes).isNotEmpty();
        // PDF magic bytes: "%PDF"
        assertThat(new String(pdfBytes, 0, 4, java.nio.charset.StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }
}
