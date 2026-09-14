CREATE TABLE lab_test_booking (
    id             UUID PRIMARY KEY,
    franchise_id   UUID NOT NULL REFERENCES franchise (id),
    patient_email  VARCHAR(255) NOT NULL,
    lab_test_id    UUID REFERENCES lab_test (id),
    combo_id       UUID REFERENCES lab_test_combo (id),
    -- Snapshot at booking time, same idea as bill_item's product_name/unit_price —
    -- a later edit/removal of the test or combo must never change a past booking.
    item_name      VARCHAR(255) NOT NULL,
    amount         NUMERIC(12, 2) NOT NULL,
    address        VARCHAR(1024) NOT NULL,
    mobile_number  VARCHAR(32) NOT NULL,
    payment_mode   VARCHAR(32) NOT NULL,
    status         VARCHAR(32) NOT NULL,
    created_at     TIMESTAMP NOT NULL,
    paid_at        TIMESTAMP,
    CONSTRAINT chk_lab_test_booking_one_item CHECK ((lab_test_id IS NOT NULL) <> (combo_id IS NOT NULL))
);

CREATE INDEX idx_lab_test_booking_franchise_id ON lab_test_booking (franchise_id);
