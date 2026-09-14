package com.company.medtech.inventory.repository;

import com.company.medtech.inventory.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByFranchiseIdAndActiveTrue(UUID franchiseId);

    /** Owner-facing listing includes inactive products too, so a deactivated one can still be found and reactivated. */
    List<Product> findByFranchiseIdOrderByNameAsc(UUID franchiseId);

    Optional<Product> findByIdAndFranchiseId(UUID id, UUID franchiseId);

    /**
     * Atomic, guarded decrement — the WHERE clause only lets this apply if
     * enough stock remains, so concurrent bills can never oversell. Returns
     * the number of rows updated: 1 = success, 0 = not found or insufficient
     * stock. Must run inside a transaction (see BillingService).
     */
    @Modifying
    @Query("update Product p set p.stockQuantity = p.stockQuantity - :quantity "
            + "where p.id = :id and p.stockQuantity >= :quantity")
    int decrementStock(@Param("id") UUID id, @Param("quantity") int quantity);

    @Modifying
    @Query("update Product p set p.stockQuantity = p.stockQuantity + :quantity where p.id = :id")
    void incrementStock(@Param("id") UUID id, @Param("quantity") int quantity);
}
