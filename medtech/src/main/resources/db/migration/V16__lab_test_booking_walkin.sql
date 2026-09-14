-- Owner-entered walk-in bookings (counter sale analog for lab tests, see
-- billing.Bill's FRANCHISE_COUNTER/PATIENT_ONLINE split). A walk-in has no
-- patient account, so patient_email becomes nullable and the walk-in's
-- name/phone are snapshotted directly on the booking instead.
ALTER TABLE lab_test_booking
    ALTER COLUMN patient_email DROP NOT NULL,
    ADD COLUMN customer_name VARCHAR(255),
    ADD COLUMN customer_phone VARCHAR(32),
    ADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'PATIENT_ONLINE';
