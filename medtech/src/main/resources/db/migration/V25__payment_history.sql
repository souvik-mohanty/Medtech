-- A ledger of individual payment events (as opposed to the single running
-- amount_paid total on lab_test_booking/payment/bill) — so the owner can
-- see exactly when and how much was collected for an order, across both
-- lab bookings and medicine bills, walk-in or online.
CREATE TABLE payment_history (
    id UUID PRIMARY KEY,
    source_type VARCHAR(16) NOT NULL,
    source_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    recorded_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_payment_history_source ON payment_history(source_type, source_id);
