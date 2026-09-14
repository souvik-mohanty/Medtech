-- One payment per booking (booking_id UNIQUE — no retry-attempt history in
-- this pass, a deliberate Stage 1 simplification; a real gateway
-- integration would need to relax this later). CASH starts PENDING until
-- the owner confirms it; every other method is mock-marked SUCCESS
-- immediately, since no real gateway is wired up anywhere in this codebase.
CREATE TABLE payment (
    id             UUID PRIMARY KEY,
    booking_id     UUID NOT NULL UNIQUE REFERENCES lab_test_booking (id),
    franchise_id   UUID NOT NULL REFERENCES franchise (id),
    patient_email  VARCHAR(255) NOT NULL,
    patient_name   VARCHAR(255) NOT NULL,
    amount         NUMERIC(12, 2) NOT NULL,
    method         VARCHAR(32) NOT NULL,
    status         VARCHAR(32) NOT NULL,
    refund_status  VARCHAR(32) NOT NULL DEFAULT 'NONE',
    created_at     TIMESTAMP NOT NULL,
    paid_at        TIMESTAMP
);

CREATE INDEX idx_payment_franchise_id ON payment (franchise_id);

-- Backfill a payment row for every booking that predates this table —
-- best-effort: method is unknowable retroactively (the old payment_mode
-- column was dropped in V11), so CASH is used as a neutral default.
INSERT INTO payment (id, booking_id, franchise_id, patient_email, patient_name, amount, method, status, refund_status, created_at, paid_at)
SELECT gen_random_uuid(), id, franchise_id, patient_email, patient_email, total_amount, 'CASH',
       CASE WHEN payment_status = 'SUCCESS' THEN 'SUCCESS' ELSE 'PENDING' END,
       'NONE', created_at, paid_at
FROM lab_test_booking;
