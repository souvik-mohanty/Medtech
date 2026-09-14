-- Walk-in bookings can be paid in full, partially, or not at all at
-- creation time (owner enters amountPaid); amount_paid is denormalized
-- onto lab_test_booking (mirroring how payment_status already is) so
-- LabTestBookingResponse doesn't need an extra join to show it.
ALTER TABLE lab_test_booking
    ADD COLUMN amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0;
UPDATE lab_test_booking SET amount_paid = total_amount WHERE payment_status = 'SUCCESS';

-- payment.patient_email becomes nullable for the same reason
-- lab_test_booking.patient_email did in V16 — a walk-in has no account.
ALTER TABLE payment
    ALTER COLUMN patient_email DROP NOT NULL,
    ADD COLUMN amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0;
UPDATE payment SET amount_paid = amount WHERE status = 'SUCCESS';
