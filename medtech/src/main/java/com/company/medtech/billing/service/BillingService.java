package com.company.medtech.billing.service;

import com.company.medtech.billing.dto.*;
import com.company.medtech.billing.model.Bill;
import com.company.medtech.billing.model.BillItem;
import com.company.medtech.billing.model.BillSource;
import com.company.medtech.billing.model.DiscountType;
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
import com.company.medtech.notification.model.NotificationType;
import com.company.medtech.notification.service.NotificationService;
import com.company.medtech.payment.dto.PaymentHistoryEntryResponse;
import com.company.medtech.payment.model.PaymentHistory;
import com.company.medtech.payment.model.PaymentSourceType;
import com.company.medtech.payment.repository.PaymentHistoryRepository;
import com.company.medtech.referral.model.CommissionType;
import com.company.medtech.referral.model.Referral;
import com.company.medtech.referral.repository.ReferralRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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
    private final ReferralRepository referralRepository;
    private final NotificationService notificationService;
    private final PaymentHistoryRepository paymentHistoryRepository;

    public BillingService(
            BillRepository billRepository,
            ProductRepository productRepository,
            FranchiseRepository franchiseRepository,
            FranchiseService franchiseService,
            InvoicePdfService invoicePdfService,
            ReferralRepository referralRepository,
            NotificationService notificationService,
            PaymentHistoryRepository paymentHistoryRepository
    ) {
        this.billRepository = billRepository;
        this.productRepository = productRepository;
        this.notificationService = notificationService;
        this.franchiseRepository = franchiseRepository;
        this.franchiseService = franchiseService;
        this.invoicePdfService = invoicePdfService;
        this.referralRepository = referralRepository;
        this.paymentHistoryRepository = paymentHistoryRepository;
    }

    private void recordPaymentHistory(UUID billId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        PaymentHistory entry = new PaymentHistory();
        entry.setSourceType(PaymentSourceType.BILL);
        entry.setSourceId(billId);
        entry.setAmount(amount);
        entry.setRecordedAt(LocalDateTime.now());
        paymentHistoryRepository.save(entry);
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
        applyDiscount(bill, request.getDiscountType(), request.getDiscountValue());
        bill.setCouponCode(request.getDiscountValue() != null ? request.getCouponCode() : null);
        bill.setNote(request.getNote());

        bill.setPaymentMode(PaymentMode.CASH);
        bill.setStatus(OrderStatus.PAID);
        bill.setCreatedAt(LocalDateTime.now());
        bill.setPaidAt(LocalDateTime.now());
        bill.setInvoiceNumber(nextInvoiceNumber(franchise.getId()));
        applyReferral(bill, franchise.getId(), request.getReferralId());

        Bill saved = billRepository.save(bill);
        recordPaymentHistory(saved.getId(), saved.getTotalAmount());
        return toResponse(saved);
    }

    /**
     * A patient's online order. CASH is always accepted — matching the same
     * "the patient can always fall back to cash" rule as lab-test bookings
     * (LabTestBookingService#bookTest) — and starts PAYMENT_PENDING, stock
     * merely checked (not reserved), no invoice number yet; the owner
     * confirms it later via #markPaid, which deducts stock and assigns the
     * invoice at that point. ONLINE is rejected outright unless the
     * franchise has an active payment gateway configured
     * (Franchise#hasActivePaymentGateway); since no real gateway is wired up
     * anywhere in this codebase, a successful ONLINE order is mock-marked
     * PAID immediately at creation — same "no real gateway, so resolve
     * instantly" convention used for lab bookings' online payment methods.
     */
    @Transactional
    public BillResponse createOnlineOrder(String patientEmail, CreateOnlineOrderRequest request) {
        UUID franchiseId = parseId(request.getFranchiseId(), "Franchise");
        Franchise franchise = franchiseRepository.findById(franchiseId)
                .orElseThrow(() -> new ResourceNotFoundException("Franchise", "id", request.getFranchiseId()));

        if (!franchise.isActive()) {
            throw new BusinessException("This store is currently unavailable.");
        }

        boolean isCash = request.getPaymentMode() == PaymentMode.CASH;
        if (!isCash && !franchise.hasActivePaymentGateway()) {
            throw new BusinessException(
                    "This store hasn't set up online payments yet. Choose cash payment instead.");
        }

        Bill bill = new Bill();
        bill.setFranchiseId(franchise.getId());
        bill.setSource(BillSource.PATIENT_ONLINE);
        bill.setPatientEmail(patientEmail);
        bill.setPaymentMode(request.getPaymentMode());
        bill.setCreatedAt(LocalDateTime.now());

        if (isCash) {
            checkStockAndAddItems(bill, franchise.getId(), request.getItems());
            applyTotals(bill);
            bill.setStatus(OrderStatus.PAYMENT_PENDING);
        } else {
            reserveStockAndAddItems(bill, franchise.getId(), request.getItems());
            applyTotals(bill);
            bill.setStatus(OrderStatus.PAID);
            bill.setPaidAt(bill.getCreatedAt());
        }

        Bill saved = billRepository.save(bill);
        if (!isCash) {
            saved.setInvoiceNumber(nextInvoiceNumber(franchise.getId()));
            saved = billRepository.save(saved);
            recordPaymentHistory(saved.getId(), saved.getTotalAmount());
        }

        String itemsSummary = bill.getItems().stream().map(BillItem::getProductName).reduce((a, b) -> a + ", " + b).orElse("your order");
        notificationService.notifyPatient(patientEmail, NotificationType.BOOKING_CONFIRMATION,
                "Order placed", "Your order for " + itemsSummary + " has been placed.");
        notificationService.notifyFranchise(franchise.getId(), NotificationType.BOOKING_CONFIRMATION,
                "New order", "A new order for " + itemsSummary + " was placed online.");

        return toResponse(saved);
    }

    /** The franchise owner confirming a CASH online order was actually paid (on delivery/pickup). Deducts stock and assigns the invoice number at this point. */
    @Transactional
    public BillResponse markPaid(String ownerEmail, String billId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        Bill bill = billRepository.findByIdAndFranchiseId(parseId(billId, "Bill"), franchise.getId())
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

        Bill saved = billRepository.save(bill);
        recordPaymentHistory(saved.getId(), saved.getTotalAmount());

        notificationService.notifyPatient(bill.getPatientEmail(), NotificationType.PAYMENT_SUCCESS,
                "Payment received", "Your payment of ₹" + bill.getTotalAmount() + " has been confirmed.");

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BillResponse> listForPatient(String patientEmail) {
        return billRepository.findByPatientEmailOrderByCreatedAtDesc(patientEmail)
                .stream()
                .map(this::toResponse)
                .toList();
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
    public byte[] renderInvoicePdfForPatient(String patientEmail, String billId) {
        Bill bill = billRepository.findByIdAndPatientEmail(parseId(billId, "Bill"), patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", "id", billId));

        if (bill.getInvoiceNumber() == null) {
            throw new BusinessException("Invoice is not available until payment is confirmed");
        }

        Franchise franchise = franchiseRepository.findById(bill.getFranchiseId())
                .orElseThrow(() -> new ResourceNotFoundException("Franchise", "id", bill.getFranchiseId().toString()));

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
        int order = 0;
        for (BillItemRequest req : requestedItems) {
            UUID productId = parseId(req.getProductId(), "Product");
            Product product = productRepository.findByIdAndFranchiseId(productId, franchiseId)
                    .orElseThrow(() -> new BusinessException("Product not found in your inventory: " + req.getProductId()));

            assertNotExpired(product);
            BillItem item = toBillItem(product, req.getQuantity(), order++);

            if (productRepository.decrementStock(product.getId(), req.getQuantity()) == 0) {
                throw new BusinessException("Insufficient stock for " + product.getName());
            }

            bill.addItem(item);
        }
    }

    private void checkStockAndAddItems(Bill bill, UUID franchiseId, List<BillItemRequest> requestedItems) {
        int order = 0;
        for (BillItemRequest req : requestedItems) {
            UUID productId = parseId(req.getProductId(), "Product");
            Product product = productRepository.findByIdAndFranchiseId(productId, franchiseId)
                    .orElseThrow(() -> new BusinessException("Product not found: " + req.getProductId()));

            assertNotExpired(product);

            if (product.getStockQuantity() < req.getQuantity()) {
                throw new BusinessException("Insufficient stock for " + product.getName());
            }

            bill.addItem(toBillItem(product, req.getQuantity(), order++));
        }
    }

    /** docs/PROJECT_SPEC.md §7.8: "cannot sell expired medicines." */
    private void assertNotExpired(Product product) {
        if (product.getExpiryDate() != null && product.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BusinessException("'" + product.getName() + "' has expired and cannot be sold");
        }
    }

    // ---- totals ----

    private BillItem toBillItem(Product product, int quantity, int order) {
        BigDecimal unitPrice = product.getSellingPrice();
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
        item.setItemOrder(order);
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
     * Counter-sale only (docs/PROJECT_SPEC.md doesn't call for this on the
     * patient online-order path). Resolves a flat-or-percentage input into a
     * fixed rupee amount at creation time — the invoice is immutable once
     * generated, so only the resolved amount is stored, not the input type.
     * Must run after applyTotals, since it needs subtotal+gstAmount.
     */
    private void applyDiscount(Bill bill, DiscountType type, BigDecimal value) {
        BigDecimal preDiscountTotal = bill.getSubtotal().add(bill.getGstAmount());

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (type != null && value != null && value.signum() > 0) {
            discountAmount = type == DiscountType.PERCENTAGE
                    ? preDiscountTotal.multiply(value).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                    : value;
            if (discountAmount.compareTo(preDiscountTotal) > 0) {
                discountAmount = preDiscountTotal; // never take the total below zero
            }
        }

        bill.setDiscountAmount(discountAmount);
        bill.setTotalAmount(preDiscountTotal.subtract(discountAmount));
    }

    /** Snapshots the referral's name/commission onto the bill at creation time — a later change to the referral's rate never rewrites history. */
    private void applyReferral(Bill bill, UUID franchiseId, String referralId) {
        if (referralId == null || referralId.isBlank()) {
            return;
        }
        Referral referral = referralRepository.findByIdAndFranchiseId(parseId(referralId, "Referral"), franchiseId)
                .orElseThrow(() -> new ResourceNotFoundException("Referral", "id", referralId));

        BigDecimal commission = referral.getCommissionType() == CommissionType.PERCENTAGE
                ? bill.getTotalAmount().multiply(referral.getCommissionValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : referral.getCommissionValue();

        bill.setReferralId(referral.getId());
        bill.setReferralName(referral.getName());
        bill.setReferralCommission(commission);
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

        List<PaymentHistoryEntryResponse> paymentHistory = paymentHistoryRepository
                .findBySourceTypeAndSourceIdOrderByRecordedAtAsc(PaymentSourceType.BILL, bill.getId())
                .stream()
                .map(h -> new PaymentHistoryEntryResponse(h.getAmount(), h.getRecordedAt()))
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
                bill.getDiscountAmount(),
                bill.getCouponCode(),
                bill.getTotalAmount(),
                bill.getPaymentMode(),
                bill.getStatus(),
                bill.getInvoiceNumber(),
                bill.getNote(),
                bill.getCreatedAt(),
                bill.getReferralId() != null ? bill.getReferralId().toString() : null,
                bill.getReferralName(),
                bill.getReferralCommission(),
                paymentHistory
        );
    }
}
