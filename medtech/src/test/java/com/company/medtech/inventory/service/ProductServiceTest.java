package com.company.medtech.inventory.service;

import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import com.company.medtech.inventory.dto.InventoryInsightsResponse;
import com.company.medtech.inventory.model.Product;
import com.company.medtech.inventory.model.SalesChannel;
import com.company.medtech.inventory.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class ProductServiceTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private FranchiseRepository franchiseRepository;

    @Autowired
    private ProductRepository productRepository;

    private Franchise franchise;

    @BeforeEach
    void setUp() {
        franchise = new Franchise();
        franchise.setOwnerEmail("owner-" + UUID.randomUUID() + "@example.com");
        franchise.setName("Test Pharmacy");
        franchise = franchiseRepository.save(franchise);
    }

    @Test
    void bucketsProductsByExpiryAndSumsInventoryValue() {
        newProduct("Fresh Stock", "100.00", 10, null);
        newProduct("Expires In 10 Days", "50.00", 4, LocalDate.now().plusDays(10));
        newProduct("Expires In 40 Days", "20.00", 5, LocalDate.now().plusDays(40));
        newProduct("Already Expired", "30.00", 2, LocalDate.now().minusDays(1));
        // Right on the 30-day boundary — must count as "soon", not fall outside it.
        newProduct("Expires Exactly In 30 Days", "10.00", 1, LocalDate.now().plusDays(30));

        InventoryInsightsResponse insights = productService.getInsights(franchise.getOwnerEmail());

        assertThat(insights.getTotalProducts()).isEqualTo(5);
        assertThat(insights.getTotalStockUnits()).isEqualTo(10 + 4 + 5 + 2 + 1);
        // 100*10 + 50*4 + 20*5 + 30*2 + 10*1 = 1000 + 200 + 100 + 60 + 10 = 1370
        assertThat(insights.getTotalInventoryValue()).isEqualByComparingTo(new BigDecimal("1370.00"));

        assertThat(insights.getExpiringSoonCount()).isEqualTo(2);
        assertThat(insights.getExpiringSoon())
                .extracting("name")
                .containsExactlyInAnyOrder("Expires In 10 Days", "Expires Exactly In 30 Days");

        assertThat(insights.getExpiredCount()).isEqualTo(1);
        assertThat(insights.getExpired()).extracting("name").containsExactly("Already Expired");
    }

    @Test
    void patientCatalogExcludesWalkInOnlyProducts() {
        newProductWithChannel("Online Item", SalesChannel.ONLINE);
        newProductWithChannel("Both Item", SalesChannel.BOTH);
        newProductWithChannel("Walk-in Only Item", SalesChannel.WALKIN);

        assertThat(productService.listForFranchise(franchise.getId().toString()))
                .extracting("name")
                .containsExactlyInAnyOrder("Online Item", "Both Item");
    }

    private void newProduct(String name, String sellingPrice, int stock, LocalDate expiryDate) {
        Product product = new Product();
        product.setFranchiseId(franchise.getId());
        product.setName(name);
        product.setSellingPrice(new BigDecimal(sellingPrice));
        product.setStockQuantity(stock);
        product.setGstPercentage(BigDecimal.ZERO);
        product.setExpiryDate(expiryDate);
        product.setActive(true);
        productRepository.save(product);
    }

    private void newProductWithChannel(String name, SalesChannel channel) {
        Product product = new Product();
        product.setFranchiseId(franchise.getId());
        product.setName(name);
        product.setSellingPrice(new BigDecimal("10.00"));
        product.setStockQuantity(5);
        product.setGstPercentage(BigDecimal.ZERO);
        product.setActive(true);
        product.setSalesChannel(channel);
        productRepository.save(product);
    }
}
