package com.company.medtech.billing.service;

import com.company.medtech.billing.dto.*;
import com.company.medtech.billing.model.Bill;
import com.company.medtech.billing.model.BillItem;
import com.company.medtech.billing.model.BillSource;
import com.company.medtech.billing.model.PaymentMode;
import com.company.medtech.billing.repository.BillRepository;
import com.company.medtech.common.enums.OrderStatus;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.inventory.model.Product;
import com.company.medtech.inventory.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BillingService {

    private final BillRepository billRepository;
    private final ProductRepository productRepository;
    private final FranchiseRepository franchiseRepository;
    private final FranchiseService franchiseService;
    private final InvoicePdfService invoicePdfService;

    public BillingService(
            BillRepository billRepository,
            ProductRepository productRepository,
            FranchiseRepository franchiseRepository,
            FranchiseService franchiseService,
            InvoicePdfService invoicePdfService
    ) {
        this.billRepository = billRepository;
        this.productRepository = productRepository;
        this.franchiseRepository = franchiseRepository;
        this.franchiseService = franchiseService;
        this.invoicePdfService = invoicePdfService;
    }

    /**
     * Franchise staff billing a walk-in customer. Paid in cash, invoiced
     * immediately. The whole thing is one DB transaction: if any item has
     * insufficient stock, everything (including items already decremented
     * earlier in the loop) rolls back automatically — no manual compensation
     * needed, unlike the old MongoDB version (single-node Mongo can't do
     * multi-document transactions).
     */
    @Transactional
    public BillResponse createCounterBill(String ownerEmail, CreateCounterBillRequest request) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);

        Bill bill = new Bill();
        bill.setFranchiseId(franchise.getId());
        bill.setSource(BillSource.FRANCHISE_COUNTER);
        bill.setCustomerName(request.getCustomerName());
        bill.setCustomerPhone(request.getCustomerPhone());

        reserveStockAndAddItems(bill, franchise.getId(), request.getItems());
        applyTotals(bill);

        bill.setPaymentMode(PaymentMode.CASH);
        bill.setStatus(OrderStatus.PAID);
        bill.setCreatedAt(LocalDateTime.now());
        bill.setPaidAt(LocalDateTime.now());
        bill.setInvoiceNumber(nextInvoiceNumber(franchise.getId()));

        return toResponse(billRepository.save(bill));
    }

    /**
     * A patient's online order. Rejected outright if the franchise has no
     * active payment gateway configured (Franchise#hasActivePaymentGateway) —
     * a franchise that hasn't set up its own Razorpay/PhonePe credentials
     * cannot accept online payment at all; the patient must buy at the
     * counter for cash instead. Stock is only checked, not reserved, and no
     * invoice number is assigned — both happen in {@link #markPaidAndGenerateInvoice}
     * once payment succeeds, matching "invoice generated only after payment
     * success" / "stock deducted only after payment success"
     * (docs/PROJECT_SPEC.md). Nothing calls that method yet: it's written
     * for the future Payment Module (Razorpay webhook) to call — this
     * endpoint alone does not complete a purchase.
     */
    @Transactional
    public BillResponse createOnlineOrder(String patientEmail, CreateOnlineOrderRequest request) {
        UUID franchiseId = parseId(request.getFranchiseId(), "Franchise");
        Franchise franchise = franchiseRepository.findById(franchiseId)
                .orElseThrow(() -> new ResourceNotFoundException("Franchise", "id", request.getFranchiseId()));

        if (!franchise.isActive()) {
            throw new BusinessException("This store is currently unavailable.");
        }

        if (!franchise.hasActivePaymentGateway()) {
            throw new BusinessException(
                    "This store hasn't set up online payments yet. Please visit in person to pay by cash.");
        }

        Bill bill = new Bill();
        bill.setFranchiseId(franchise.getId());
        bill.setSource(BillSource.PATIENT_ONLINE);
        bill.setPatientEmail(patientEmail);

        checkStockAndAddItems(bill, franchise.getId(), request.getItems());
        applyTotals(bill);

        bill.setPaymentMode(PaymentMode.ONLINE);
        bill.setStatus(OrderStatus.PAYMENT_PENDING);
        bill.setCreatedAt(LocalDateTime.now());

        return toResponse(billRepository.save(bill));
    }

    /**
     * Not wired to any endpoint yet. The future Payment Module should call
     * this from its Razorpay webhook once a PATIENT_ONLINE bill's payment is
     * confirmed.
     */
    @Transactional
    public BillResponse markPaidAndGenerateInvoice(String billId) {
        Bill bill = billRepository.findById(parseId(billId, "Bill"))
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", billId));

        if (bill.getStatus() == OrderStatus.PAID) {
            return toResponse(bill);
        }

        for (BillItem item : bill.getItems()) {
            if (productRepository.decrementStock(item.getProductId(), item.getQuantity()) == 0) {
                throw new BusinessException("Insufficient stock for " + item.getProductName());
            }
        }

        bill.setStatus(OrderStatus.PAID);
        bill.setPaidAt(LocalDateTime.now());
        bill.setInvoiceNumber(nextInvoiceNumber(bill.getFranchiseId()));

        return toResponse(billRepository.save(bill));
    }

    @Transactional(readOnly = true)
    public byte[] renderInvoicePdf(String ownerEmail, String billId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        Bill bill = billRepository.findByIdAndFranchiseId(parseId(billId, "Bill"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", billId));

        if (bill.getInvoiceNumber() == null) {
            throw new BusinessException("Invoice is not available until payment is confirmed");
        }

        return invoicePdfService.render(franchise, bill);
    }

    @Transactional(readOnly = true)
    public List<BillResponse> listForOwner(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return billRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ---- stock handling ----

    /**
     * Builds each BillItem's snapshot before decrementing, then decrements
     * atomically and guarded (ProductRepository#decrementStock only applies
     * if enough stock remains). If any item fails, the BusinessException
     * propagates out of this @Transactional call chain and the whole
     * transaction — including every decrement already applied earlier in
     * the loop — rolls back.
     */
    private void reserveStockAndAddItems(Bill bill, UUID franchiseId, List<BillItemRequest> requestedItems) {
        for (BillItemRequest req : requestedItems) {
            UUID productId = parseId(req.getProductId(), "Product");
            Product product = productRepository.findByIdAndFranchiseId(productId, franchiseId)
                    .orElseThrow(() -> new BusinessException("Product not found in your inventory: " + req.getProductId()));

            BillItem item = toBillItem(product, req.getQuantity());

            if (productRepository.decrementStock(product.getId(), req.getQuantity()) == 0) {
                throw new BusinessException("Insufficient stock for " + product.getName());
            }

            bill.addItem(item);
        }
    }

    private void checkStockAndAddItems(Bill bill, UUID franchiseId, List<BillItemRequest> requestedItems) {
        for (BillItemRequest req : requestedItems) {
            UUID productId = parseId(req.getProductId(), "Product");
            Product product = productRepository.findByIdAndFranchiseId(productId, franchiseId)
                    .orElseThrow(() -> new BusinessException("Product not found: " + req.getProductId()));

            if (product.getStockQuantity() < req.getQuantity()) {
                throw new BusinessException("Insufficient stock for " + product.getName());
            }

            bill.addItem(toBillItem(product, req.getQuantity()));
        }
    }

    // ---- totals ----

    private BillItem toBillItem(Product product, int quantity) {
        BigDecimal unitPrice = product.getPrice();
        BigDecimal gstPercentage = product.getGstPercentage() != null ? product.getGstPercentage() : BigDecimal.ZERO;

        BigDecimal lineSubtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        BigDecimal lineGstAmount = lineSubtotal.multiply(gstPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal lineTotal = lineSubtotal.add(lineGstAmount);

        BillItem item = new BillItem();
        item.setProductId(product.getId());
        item.setProductName(product.getName());
        item.setUnitPrice(unitPrice);
        item.setQuantity(quantity);
        item.setGstPercentage(gstPercentage);
        item.setLineSubtotal(lineSubtotal);
        item.setLineGstAmount(lineGstAmount);
        item.setLineTotal(lineTotal);
        return item;
    }

    private void applyTotals(Bill bill) {
        BigDecimal subtotal = bill.getItems().stream().map(BillItem::getLineSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal gstAmount = bill.getItems().stream().map(BillItem::getLineGstAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        bill.setSubtotal(subtotal);
        bill.setGstAmount(gstAmount);
        bill.setTotalAmount(subtotal.add(gstAmount));
    }

    /**
     * Franchise-wise sequential invoice numbering (docs/PROJECT_SPEC.md).
     * Row-locks the franchise for the rest of this transaction
     * (PESSIMISTIC_WRITE via FranchiseRepository#findByIdForUpdate) so two
     * bills for the same franchise can never be assigned the same sequence.
     */
    private String nextInvoiceNumber(UUID franchiseId) {
        Franchise locked = franchiseRepository.findByIdForUpdate(franchiseId)
                .orElseThrow(() -> new ResourceNotFoundException("Franchise", "id", franchiseId.toString()));

        long sequence = locked.getInvoiceSequence() + 1;
        locked.setInvoiceSequence(sequence);
        franchiseRepository.save(locked);

        String prefix = (locked.getInvoicePrefix() != null && !locked.getInvoicePrefix().isBlank())
                ? locked.getInvoicePrefix()
                : locked.getId().toString().substring(0, 6).toUpperCase();

        return prefix + "-" + String.format("%06d", sequence);
    }

    private UUID parseId(String id, String resourceName) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException(resourceName, "id", id);
        }
    }

    private BillResponse toResponse(Bill bill) {
        List<BillItemResponse> itemResponses = bill.getItems().stream()
                .map(i -> new BillItemResponse(
                        i.getProductId().toString(), i.getProductName(), i.getUnitPrice(),
                        i.getQuantity(), i.getGstPercentage(), i.getLineTotal()))
                .toList();

        return new BillResponse(
                bill.getId().toString(),
                bill.getFranchiseId().toString(),
                bill.getSource(),
                bill.getCustomerName(),
                bill.getCustomerPhone(),
                bill.getPatientEmail(),
                itemResponses,
                bill.getSubtotal(),
                bill.getGstAmount(),
                bill.getTotalAmount(),
                bill.getPaymentMode(),
                bill.getStatus(),
                bill.getInvoiceNumber(),
                bill.getCreatedAt()
        );
    }
}
