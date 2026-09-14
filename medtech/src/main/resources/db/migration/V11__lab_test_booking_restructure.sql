-- Restructures lab_test_booking from "exactly one test or one combo" into
-- a real multi-item, multi-status booking matching lp-care-web's Booking
-- type: individual tests (possibly several), or a package that expands
-- into item rows at booking time; collection method/address/date/slot;
-- a 6-state collection-status workflow; a full discount/GST/total
-- breakdown computed server-side. gen_random_uuid() is built into
-- PostgreSQL 13+ core (no pgcrypto extension needed) — used only for this
-- one-off data migration, the application itself still generates all IDs
-- app-side (see V1's note).

CREATE TABLE lab_test_booking_item (
    id           UUID PRIMARY KEY,
    booking_id   UUID NOT NULL REFERENCES lab_test_booking (id),
    lab_test_id  UUID REFERENCES lab_test (id),
    item_name    VARCHAR(255) NOT NULL,
    amount       NUMERIC(12, 2) NOT NULL,
    item_order   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_lab_test_booking_item_booking_id ON lab_test_booking_item (booking_id);

-- Preserve existing bookings as one item each. A combo booking's exact test
-- breakdown at that past point in time isn't retroactively knowable, so it
-- becomes a single item snapshotting the combo's old name/amount — no
-- fabricated breakdown.
INSERT INTO lab_test_booking_item (id, booking_id, lab_test_id, item_name, amount, item_order)
SELECT gen_random_uuid(), id, lab_test_id, item_name, amount, 0
FROM lab_test_booking;

-- New booking-level columns, nullable first so the pre-existing rows can be
-- backfilled before NOT NULL is enforced.
ALTER TABLE lab_test_booking ADD COLUMN package_id UUID REFERENCES lab_test_combo (id);
ALTER TABLE lab_test_booking ADD COLUMN package_name VARCHAR(255);
ALTER TABLE lab_test_booking ADD COLUMN for_family_member_id UUID;
ALTER TABLE lab_test_booking ADD COLUMN for_family_member_name VARCHAR(255);
ALTER TABLE lab_test_booking ADD COLUMN collection_method VARCHAR(32);
ALTER TABLE lab_test_booking ADD COLUMN address_id UUID;
ALTER TABLE lab_test_booking ADD COLUMN address_label VARCHAR(64);
ALTER TABLE lab_test_booking ADD COLUMN collection_date DATE;
ALTER TABLE lab_test_booking ADD COLUMN collection_slot VARCHAR(64);
ALTER TABLE lab_test_booking ADD COLUMN collection_status VARCHAR(32);
ALTER TABLE lab_test_booking ADD COLUMN subtotal NUMERIC(12, 2);
ALTER TABLE lab_test_booking ADD COLUMN discount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE lab_test_booking ADD COLUMN collection_charge NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE lab_test_booking ADD COLUMN gst NUMERIC(12, 2);
ALTER TABLE lab_test_booking ADD COLUMN total_amount NUMERIC(12, 2);
ALTER TABLE lab_test_booking ADD COLUMN coupon_code VARCHAR(64);
ALTER TABLE lab_test_booking ADD COLUMN payment_status VARCHAR(32);

-- Backfill: a pre-existing booking had no collection scheduling concept at
-- all, so it's marked a completed lab visit with no GST previously charged
-- (this codebase's GST/collection-charge math didn't exist before this
-- migration) — subtotal/total both equal the old flat "amount".
UPDATE lab_test_booking SET
    collection_method = 'LAB_VISIT',
    collection_status = 'COMPLETED',
    subtotal = amount,
    gst = 0,
    total_amount = amount,
    payment_status = CASE WHEN status = 'PAID' THEN 'SUCCESS' ELSE 'PENDING' END;

ALTER TABLE lab_test_booking ALTER COLUMN collection_method SET NOT NULL;
ALTER TABLE lab_test_booking ALTER COLUMN collection_status SET NOT NULL;
ALTER TABLE lab_test_booking ALTER COLUMN subtotal SET NOT NULL;
ALTER TABLE lab_test_booking ALTER COLUMN gst SET NOT NULL;
ALTER TABLE lab_test_booking ALTER COLUMN total_amount SET NOT NULL;
ALTER TABLE lab_test_booking ALTER COLUMN payment_status SET NOT NULL;

-- status (OrderStatus: PAYMENT_PENDING/PAID) is replaced by the richer
-- lab.model.BookingStatus (9 values) — map the two old values across, add
-- the new column nullable, backfill, then enforce NOT NULL and drop the old.
ALTER TABLE lab_test_booking ADD COLUMN new_status VARCHAR(32);
UPDATE lab_test_booking SET new_status = CASE WHEN status = 'PAID' THEN 'COMPLETED' ELSE 'PENDING_PAYMENT' END;
ALTER TABLE lab_test_booking ALTER COLUMN new_status SET NOT NULL;

ALTER TABLE lab_test_booking DROP CONSTRAINT chk_lab_test_booking_one_item;
ALTER TABLE lab_test_booking DROP COLUMN lab_test_id;
ALTER TABLE lab_test_booking DROP COLUMN combo_id;
ALTER TABLE lab_test_booking DROP COLUMN item_name;
ALTER TABLE lab_test_booking DROP COLUMN amount;
ALTER TABLE lab_test_booking DROP COLUMN address;
ALTER TABLE lab_test_booking DROP COLUMN mobile_number;
ALTER TABLE lab_test_booking DROP COLUMN payment_mode;
ALTER TABLE lab_test_booking DROP COLUMN status;
ALTER TABLE lab_test_booking RENAME COLUMN new_status TO status;

ALTER TABLE lab_test_booking ADD CONSTRAINT chk_lab_test_booking_home_needs_address
    CHECK (collection_method <> 'HOME_COLLECTION' OR address_id IS NOT NULL);
