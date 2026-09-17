package com.company.medtech.inventory.repository;

import com.company.medtech.inventory.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

// This is a Spring Data JPA "repository" — the layer of the app that talks to the database.
// It's just an interface with NO implementation written anywhere: Spring scans for interfaces
// like this one at startup and auto-generates a working class behind the scenes (using a dynamic
// proxy). That's why you never see a "ProductRepositoryImpl.java" file in this codebase.
//
// Extending JpaRepository<Product, UUID> gives this interface a full set of ready-made CRUD
// methods for free: save(), findById(), findAll(), deleteById(), count(), etc.
// The two generic types are: <the Entity type this repository manages, the type of that entity's @Id field>.
//
// Interview Q: "What is a Spring Data JPA repository, and why don't you write an implementation
// class for it yourself?" — because Spring generates a proxy implementation at runtime from the
// interface's method signatures, using either name-based query derivation or an explicit @Query.
public interface ProductRepository extends JpaRepository<Product, UUID> {

    // "Query derivation" / "derived query methods": Spring Data JPA parses the METHOD NAME itself
    // and builds the SQL/JPQL for you — no @Query annotation needed. Reading left to right:
    //   findBy          -> SELECT ...
    //   FranchiseId     -> WHERE franchise_id = ?1
    //   And             -> combine conditions with AND
    //   ActiveTrue      -> AND active = true
    // So this one method name alone becomes: "SELECT * FROM product WHERE franchise_id = ? AND active = true".
    // This only works because "franchiseId" and "active" are real field names on the Product entity —
    // rename a field there and this method name must be renamed to match, or the app fails to start.
    List<Product> findByFranchiseIdAndActiveTrue(UUID franchiseId);

    /** Owner-facing listing includes inactive products too, so a deactivated one can still be found and reactivated. */
    List<Product> findByFranchiseIdOrderByNameAsc(UUID franchiseId);

    // Optional<Product> instead of a raw Product — this is the Java-idiomatic way to say
    // "this might not find anything, and that's a normal, expected outcome, not an error."
    // The caller is forced to explicitly handle the "not found" case (e.g. via .orElseThrow(...))
    // instead of accidentally getting a silent null and crashing later with a NullPointerException.
    Optional<Product> findByIdAndFranchiseId(UUID id, UUID franchiseId);

    /**
     * Atomic, guarded decrement — the WHERE clause only lets this apply if
     * enough stock remains, so concurrent bills can never oversell. Returns
     * the number of rows updated: 1 = success, 0 = not found or insufficient
     * stock. Must run inside a transaction (see BillingService).
     */
    // @Modifying tells Spring "this @Query is an UPDATE/DELETE/INSERT, not a SELECT" — without it,
    // Spring would try to treat the query as one that returns entities and throw an error.
    // @Query's text here is JPQL (Java Persistence Query Language), not raw SQL: notice it says
    // "Product p" and "p.stockQuantity" (the ENTITY CLASS and its JAVA FIELD names), not the actual
    // database table/column names — Hibernate translates this into real SQL against product/stock_quantity.
    //
    // Why do the subtraction and the safety check in ONE database statement instead of doing
    // "read stock, check in Java if enough, then write new stock"? Because two separate steps have a
    // classic race condition: two customers buying the last item at the exact same moment could both
    // read "stock = 1", both see "that's enough", and both proceed — overselling by one unit.
    // Doing "UPDATE ... WHERE stock_quantity >= :quantity" as a single atomic SQL statement means the
    // database itself guarantees only one of those two concurrent requests can succeed; the loser's
    // WHERE clause simply won't match any row (since the winner already dropped the stock below the
    // needed quantity), so it updates 0 rows instead of driving stock negative.
    //
    // Interview Q: "How would you prevent overselling the last unit of stock when two orders arrive
    // at the same instant?" — a great answer is exactly this pattern: push the check into the
    // UPDATE's WHERE clause so the database engine enforces atomicity, rather than checking in
    // application code first and writing second (check-then-act race condition).
    // (The alternative, heavier-weight approach is pessimistic row locking, e.g. "SELECT ... FOR
    // UPDATE", which blocks other transactions from touching the row until this one commits.)
    @Modifying
    @Query("update Product p set p.stockQuantity = p.stockQuantity - :quantity "
            + "where p.id = :id and p.stockQuantity >= :quantity")
    int decrementStock(@Param("id") UUID id, @Param("quantity") int quantity);

    // Returns int (not void!) so the caller can tell success from failure without a separate
    // lookup: JPA/Hibernate reports back how many rows the UPDATE actually touched.
    //   1 -> the product existed and had enough stock, the decrement happened.
    //   0 -> either the id didn't exist, or stock_quantity was already below the requested quantity —
    //        the caller (BillingService) checks for this and turns it into a proper business error.
    //
    // Interview Q: "Why does this method return int while the very similar incrementStock() below
    // returns void?" — because a decrement can legitimately fail (not enough stock) and the caller
    // needs to detect that; an increment (e.g. restocking, or reversing a cancelled order) has no
    // such failure condition to guard against, so there's nothing meaningful to report back.
    @Modifying
    @Query("update Product p set p.stockQuantity = p.stockQuantity + :quantity where p.id = :id")
    void incrementStock(@Param("id") UUID id, @Param("quantity") int quantity);
}
