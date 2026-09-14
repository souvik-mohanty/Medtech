package com.company.medtech.franchise.repository;

import com.company.medtech.franchise.model.Franchise;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface FranchiseRepository extends JpaRepository<Franchise, UUID> {

    Optional<Franchise> findByOwnerEmail(String ownerEmail);

    /**
     * Row-locks the franchise for the rest of the current transaction — used
     * only to atomically increment invoiceSequence (see
     * BillingService#nextInvoiceNumber) without a race between two bills
     * generated for the same franchise at once.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Franchise f where f.id = :id")
    Optional<Franchise> findByIdForUpdate(UUID id);
}
