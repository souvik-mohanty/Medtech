-- Collection/delivery charge becomes owner-configurable instead of the
-- hardcoded 99 in LabTestBookingService. free_collection_min_order is
-- nullable: NULL means no threshold is configured, so home collection is
-- always charged (matches today's existing hardcoded behavior exactly, so
-- no existing franchise silently starts giving free collection).
ALTER TABLE franchise
    ADD COLUMN collection_charge NUMERIC(12,2) NOT NULL DEFAULT 99,
    ADD COLUMN free_collection_min_order NUMERIC(12,2);
