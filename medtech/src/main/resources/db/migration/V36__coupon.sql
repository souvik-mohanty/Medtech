CREATE TABLE coupon (
    id UUID PRIMARY KEY,
    franchise_id UUID NOT NULL REFERENCES franchise(id),
    code VARCHAR(64) NOT NULL,
    type VARCHAR(16) NOT NULL,
    coupon_value NUMERIC(12,2) NOT NULL,
    description VARCHAR(500),
    min_order_amount NUMERIC(12,2),
    expires_at TIMESTAMP NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_coupon_franchise_code UNIQUE (franchise_id, code)
);

CREATE INDEX idx_coupon_franchise_id ON coupon(franchise_id);
