package com.company.medtech.inventory.service;

import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.inventory.dto.ProductRequest;
import com.company.medtech.inventory.dto.ProductResponse;
import com.company.medtech.inventory.model.Product;
import com.company.medtech.inventory.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

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
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        product.setGstPercentage(request.getGstPercentage() != null ? request.getGstPercentage() : BigDecimal.ZERO);
        product.setActive(true);

        return toResponse(productRepository.save(product));
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
                product.getPrice(),
                product.getStockQuantity(),
                product.getGstPercentage()
        );
    }
}
