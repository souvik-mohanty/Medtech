package com.company.medtech.billing.service;

import com.company.medtech.billing.model.Bill;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.model.InvoiceFont;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

/**
 * Renders a Bill + Franchise into a printable invoice PDF using the
 * franchise's structured branding (logo, accent color, font — see
 * InvoiceFont). Template: resources/templates/invoices/medicine/default.html.
 */
@Service
public class InvoicePdfService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

    private final SpringTemplateEngine templateEngine;

    public InvoicePdfService(SpringTemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public byte[] render(Franchise franchise, Bill bill) {
        Context context = new Context();
        context.setVariable("franchise", franchise);
        context.setVariable("bill", bill);
        context.setVariable("fontFamily", fontFamilyFor(franchise.getInvoiceFont()));
        context.setVariable("accentColor", franchise.getAccentColorHex() != null ? franchise.getAccentColorHex() : "#1F8A70");
        context.setVariable("invoiceDate", bill.getPaidAt() != null ? bill.getPaidAt().format(DATE_FORMAT) : "");

        String html = templateEngine.process("invoices/medicine/default", context);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, "");
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (IOException e) {
            throw new BusinessException("Failed to generate invoice PDF");
        }
    }

    private String fontFamilyFor(InvoiceFont font) {
        if (font == null) {
            return "Helvetica, Arial, sans-serif";
        }
        return switch (font) {
            case SERIF -> "Georgia, 'Times New Roman', serif";
            case MONOSPACE -> "'Courier New', monospace";
            case DEFAULT -> "Helvetica, Arial, sans-serif";
        };
    }
}
