package com.company.medtech.inventory.service;

import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.inventory.dto.InventoryInsightsResponse;
import com.company.medtech.inventory.dto.ProductRequest;
import com.company.medtech.inventory.dto.ProductResponse;
import com.company.medtech.inventory.model.Product;
import com.company.medtech.inventory.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    /** How many days out counts as "expiring soon" on the dashboard. */
    private static final int EXPIRY_SOON_DAYS = 30;

    private final ProductRepository productRepository;
    private final FranchiseService franchiseService;

    public ProductService(ProductRepository productRepository, FranchiseService franchiseService) {
        this.productRepository = productRepository;
        this.franchiseService = franchiseService;
    }

    public List<ProductResponse> listForOwner(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return productRepository.findByFranchiseIdAndActiveTrue(franchise.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** Used by patients browsing a franchise's catalog to place an online order. */
    public List<ProductResponse> listForFranchise(String franchiseId) {
        UUID id = parseFranchiseId(franchiseId);
        return productRepository.findByFranchiseIdAndActiveTrue(id)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse create(String ownerEmail, ProductRequest request) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);

        Product product = new Product();
        product.setFranchiseId(franchise.getId());
        product.setName(request.getName());
        product.setUnit(request.getUnit());
        product.setSellingPrice(request.getSellingPrice());
        product.setPurchasePrice(request.getPurchasePrice());
        product.setMfgDate(request.getMfgDate());
        product.setPurchaseDate(request.getPurchaseDate());
        product.setExpiryDate(request.getExpiryDate());
        product.setStockQuantity(request.getStockQuantity());
        product.setGstPercentage(request.getGstPercentage() != null ? request.getGstPercentage() : BigDecimal.ZERO);
        product.setActive(true);

        return toResponse(productRepository.save(product));
    }

    /** Dashboard figures — total stock, valuation, and expiry-driven alerts. */
    public InventoryInsightsResponse getInsights(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        List<Product> products = productRepository.findByFranchiseIdAndActiveTrue(franchise.getId());

        LocalDate today = LocalDate.now();
        LocalDate soonCutoff = today.plusDays(EXPIRY_SOON_DAYS);

        BigDecimal totalInventoryValue = products.stream()
                .map(p -> p.getSellingPrice().multiply(BigDecimal.valueOf(p.getStockQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ProductResponse> expired = products.stream()
                .filter(p -> p.getExpiryDate() != null && p.getExpiryDate().isBefore(today))
                .map(this::toResponse)
                .toList();

        List<ProductResponse> expiringSoon = products.stream()
                .filter(p -> p.getExpiryDate() != null
                        && !p.getExpiryDate().isBefore(today)
                        && !p.getExpiryDate().isAfter(soonCutoff))
                .map(this::toResponse)
                .toList();

        long totalStockUnits = products.stream().mapToLong(Product::getStockQuantity).sum();

        return new InventoryInsightsResponse(
                products.size(),
                totalStockUnits,
                totalInventoryValue,
                expiringSoon.size(),
                expiringSoon,
                expired.size(),
                expired
        );
    }

    private UUID parseFranchiseId(String franchiseId) {
        try {
            return UUID.fromString(franchiseId);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Franchise", "id", franchiseId);
        }
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId().toString(),
                product.getName(),
                product.getUnit(),
                product.getSellingPrice(),
                product.getPurchasePrice(),
                product.getMfgDate(),
                product.getPurchaseDate(),
                product.getExpiryDate(),
                product.getStockQuantity(),
                product.getGstPercentage()
        );
    }
}
