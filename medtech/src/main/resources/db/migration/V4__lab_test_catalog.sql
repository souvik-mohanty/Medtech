CREATE TABLE lab_test (
    id            UUID PRIMARY KEY,
    franchise_id  UUID NOT NULL REFERENCES franchise (id),
    name          VARCHAR(255) NOT NULL,
    price         NUMERIC(12, 2) NOT NULL,
    active        BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_lab_test_franchise_id ON lab_test (franchise_id);

CREATE TABLE lab_test_combo (
    id            UUID PRIMARY KEY,
    franchise_id  UUID NOT NULL REFERENCES franchise (id),
    name          VARCHAR(255) NOT NULL,
    combo_price   NUMERIC(12, 2) NOT NULL,
    active        BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_lab_test_combo_franchise_id ON lab_test_combo (franchise_id);

-- A test can belong to several combos, and a combo bundles several tests —
-- plain many-to-many, not a line-item snapshot (unlike bill_item).
CREATE TABLE combo_test_item (
    combo_id    UUID NOT NULL REFERENCES lab_test_combo (id) ON DELETE CASCADE,
    lab_test_id UUID NOT NULL REFERENCES lab_test (id) ON DELETE CASCADE,
    PRIMARY KEY (combo_id, lab_test_id)
);
