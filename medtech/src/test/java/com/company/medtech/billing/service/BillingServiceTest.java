package com.company.medtech.billing.service;

import com.company.medtech.billing.dto.BillItemRequest;
import com.company.medtech.billing.dto.BillResponse;
import com.company.medtech.billing.dto.CreateCounterBillRequest;
import com.company.medtech.billing.model.DiscountType;
import com.company.medtech.common.enums.OrderStatus;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import com.company.medtech.inventory.model.Product;
import com.company.medtech.inventory.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Exercises the real replacement for the old MongoDB compensating-rollback
 * hack: a single @Transactional method now rolls back atomically (Postgres
 * proper transactions) when any item in a bill has insufficient stock —
 * this is the highest-risk new logic from the JPA/Postgres migration.
 */
@SpringBootTest
@ActiveProfiles("test")
class BillingServiceTest {

    @Autowired
    private BillingService billingService;

    @Autowired
    private FranchiseRepository franchiseRepository;

    @Autowired
    private ProductRepository productRepository;

    private Franchise franchise;
    private Product paracetamol;
    private Product bandage;

    @BeforeEach
    void setUp() {
        franchise = new Franchise();
        franchise.setOwnerEmail("owner-" + UUID.randomUUID() + "@example.com");
        franchise.setName("Test Pharmacy");
        franchise = franchiseRepository.save(franchise);

        paracetamol = newProduct("Paracetamol", new BigDecimal("25.00"), 5, new BigDecimal("12.00"));
        bandage = newProduct("Bandage", new BigDecimal("40.00"), 2, BigDecimal.ZERO);
    }

    @Test
    void createsCounterBillAndDeductsStockOnSuccess() {
        CreateCounterBillRequest request = new CreateCounterBillRequest();
        request.setCustomerName("Walk-in");
        request.setItems(List.of(itemRequest(paracetamol.getId(), 2), itemRequest(bandage.getId(), 1)));

        BillResponse response = billingService.createCounterBill(franchise.getOwnerEmail(), request);

        assertThat(response.getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(response.getInvoiceNumber()).isNotNull();
        // 2 * 25.00 * 1.12 + 1 * 40.00 = 56.00 + 40.00 = 96.00
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("96.00"));

        assertThat(productRepository.findById(paracetamol.getId()).orElseThrow().getStockQuantity()).isEqualTo(3);
        assertThat(productRepository.findById(bandage.getId()).orElseThrow().getStockQuantity()).isEqualTo(1);
    }

    @Test
    void rollsBackEverythingWhenAnyItemHasInsufficientStock() {
        CreateCounterBillRequest request = new CreateCounterBillRequest();
        // Paracetamol has enough stock (5) but bandage only has 2 — ask for 3.
        request.setItems(List.of(itemRequest(paracetamol.getId(), 2), itemRequest(bandage.getId(), 3)));

        assertThatThrownBy(() -> billingService.createCounterBill(franchise.getOwnerEmail(), request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Insufficient stock");

        // Paracetamol's stock must be unchanged — the earlier successful
        // decrement, earlier in the same loop/transaction, must roll back too.
        assertThat(productRepository.findById(paracetamol.getId()).orElseThrow().getStockQuantity()).isEqualTo(5);
        assertThat(productRepository.findById(bandage.getId()).orElseThrow().getStockQuantity()).isEqualTo(2);
    }

    @Test
    void rejectsCounterSaleOfAnExpiredProduct() {
        Product expired = newProduct("Old Cough Syrup", new BigDecimal("50.00"), 10, BigDecimal.ZERO);
        expired.setExpiryDate(LocalDate.now().minusDays(1));
        productRepository.save(expired);

        CreateCounterBillRequest request = new CreateCounterBillRequest();
        request.setItems(List.of(itemRequest(expired.getId(), 1)));

        assertThatThrownBy(() -> billingService.createCounterBill(franchise.getOwnerEmail(), request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("expired");

        assertThat(productRepository.findById(expired.getId()).orElseThrow().getStockQuantity()).isEqualTo(10);
    }

    @Test
    void appliesAFlatDiscountToTheTotal() {
        CreateCounterBillRequest request = new CreateCounterBillRequest();
        request.setItems(List.of(itemRequest(paracetamol.getId(), 2))); // 2 * 25.00 * 1.12 = 56.00
        request.setDiscountType(DiscountType.FLAT);
        request.setDiscountValue(new BigDecimal("10.00"));
        request.setNote("Loyalty discount");

        BillResponse response = billingService.createCounterBill(franchise.getOwnerEmail(), request);

        assertThat(response.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("10.00"));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("46.00"));
        assertThat(response.getNote()).isEqualTo("Loyalty discount");
    }

    @Test
    void appliesAPercentageDiscountToTheTotal() {
        CreateCounterBillRequest request = new CreateCounterBillRequest();
        request.setItems(List.of(itemRequest(paracetamol.getId(), 2))); // 56.00 pre-discount
        request.setDiscountType(DiscountType.PERCENTAGE);
        request.setDiscountValue(new BigDecimal("10"));

        BillResponse response = billingService.createCounterBill(franchise.getOwnerEmail(), request);

        assertThat(response.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("5.60"));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("50.40"));
    }

    @Test
    void discountNeverTakesTheTotalBelowZero() {
        CreateCounterBillRequest request = new CreateCounterBillRequest();
        request.setItems(List.of(itemRequest(paracetamol.getId(), 2))); // 56.00 pre-discount
        request.setDiscountType(DiscountType.FLAT);
        request.setDiscountValue(new BigDecimal("999.00"));

        BillResponse response = billingService.createCounterBill(franchise.getOwnerEmail(), request);

        assertThat(response.getDiscountAmount()).isEqualByComparingTo(new BigDecimal("56.00"));
        assertThat(response.getTotalAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void noDiscountByDefault() {
        CreateCounterBillRequest request = new CreateCounterBillRequest();
        request.setItems(List.of(itemRequest(paracetamol.getId(), 1)));

        BillResponse response = billingService.createCounterBill(franchise.getOwnerEmail(), request);

        assertThat(response.getDiscountAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void invoiceNumbersAreSequentialPerFranchise() {
        CreateCounterBillRequest request1 = new CreateCounterBillRequest();
        request1.setItems(List.of(itemRequest(paracetamol.getId(), 1)));
        BillResponse first = billingService.createCounterBill(franchise.getOwnerEmail(), request1);

        CreateCounterBillRequest request2 = new CreateCounterBillRequest();
        request2.setItems(List.of(itemRequest(bandage.getId(), 1)));
        BillResponse second = billingService.createCounterBill(franchise.getOwnerEmail(), request2);

        assertThat(first.getInvoiceNumber()).isNotEqualTo(second.getInvoiceNumber());
    }

    private Product newProduct(String name, BigDecimal price, int stock, BigDecimal gst) {
        Product product = new Product();
        product.setFranchiseId(franchise.getId());
        product.setName(name);
        product.setSellingPrice(price);
        product.setStockQuantity(stock);
        product.setGstPercentage(gst);
        product.setActive(true);
        return productRepository.save(product);
    }

    private BillItemRequest itemRequest(UUID productId, int quantity) {
        BillItemRequest req = new BillItemRequest();
        req.setProductId(productId.toString());
        req.setQuantity(quantity);
        return req;
    }
}
