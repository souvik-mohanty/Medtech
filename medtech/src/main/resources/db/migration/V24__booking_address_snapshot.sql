-- The owner needs to see the actual delivery address (not just its label)
-- and the patient's phone number on a booking, without an extra join —
-- snapshotted at booking time, same "snapshot, don't recompute" convention
-- as every other field on this table.
ALTER TABLE lab_test_booking
    ADD COLUMN address_line1 VARCHAR(255),
    ADD COLUMN address_line2 VARCHAR(255),
    ADD COLUMN address_city VARCHAR(100),
    ADD COLUMN address_state VARCHAR(100),
    ADD COLUMN address_pincode VARCHAR(20);
