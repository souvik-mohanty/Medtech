-- Initial schema. IDs are UUIDs generated application-side (Hibernate
-- GenerationType.UUID), not by Postgres, so no gen_random_uuid()/pgcrypto
-- extension is needed.

CREATE TABLE franchise (
    id                            UUID PRIMARY KEY,
    owner_email                   VARCHAR(255) NOT NULL UNIQUE,
    name                          VARCHAR(255),
    gstin                         VARCHAR(64),
    contact_phone                 VARCHAR(32),
    contact_email                 VARCHAR(255),
    logo_url                      VARCHAR(1024),
    accent_color_hex              VARCHAR(16)  NOT NULL DEFAULT '#1F8A70',
    invoice_font                  VARCHAR(32)  NOT NULL DEFAULT 'DEFAULT',
    invoice_footer_note           VARCHAR(1024),
    invoice_prefix                VARCHAR(32),
    invoice_sequence              BIGINT       NOT NULL DEFAULT 0,
    active                        BOOLEAN      NOT NULL DEFAULT TRUE,
    payment_provider              VARCHAR(32)  NOT NULL DEFAULT 'NONE',
    payment_api_key               VARCHAR(255),
    payment_encrypted_api_secret  VARCHAR(1024),
    payment_active                BOOLEAN      NOT NULL DEFAULT FALSE
);

-- Every account signs in via Google OAuth, which always supplies email —
-- see docs/PROJECT_SPEC.md's login-method table.
CREATE TABLE user_auth (
    id            UUID PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    mobile        VARCHAR(32) UNIQUE,
    role          VARCHAR(32)  NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Only set for franchise-scoped staff (Doctor/Lab Technician/Delivery
    -- Partner) — see AppConstants.FRANCHISE_SCOPED_ROLES.
    franchise_id  UUID REFERENCES franchise (id)
);

CREATE INDEX idx_user_auth_franchise_id ON user_auth (franchise_id);

CREATE TABLE product (
    id              UUID PRIMARY KEY,
    franchise_id    UUID NOT NULL REFERENCES franchise (id),
    name            VARCHAR(255) NOT NULL,
    unit            VARCHAR(64),
    price           NUMERIC(12, 2) NOT NULL,
    stock_quantity  INTEGER NOT NULL,
    gst_percentage  NUMERIC(5, 2) NOT NULL DEFAULT 0,
    active          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_product_franchise_id ON product (franchise_id);

-- Immutable once created (no update endpoint) — see docs/PROJECT_SPEC.md's
-- billing section.
CREATE TABLE bill (
    id              UUID PRIMARY KEY,
    franchise_id    UUID NOT NULL REFERENCES franchise (id),
    source          VARCHAR(32) NOT NULL,
    customer_name   VARCHAR(255),
    customer_phone  VARCHAR(32),
    patient_email   VARCHAR(255),
    subtotal        NUMERIC(12, 2) NOT NULL,
    gst_amount      NUMERIC(12, 2) NOT NULL,
    total_amount    NUMERIC(12, 2) NOT NULL,
    payment_mode    VARCHAR(32) NOT NULL,
    status          VARCHAR(32) NOT NULL,
    -- Assigned only once payment succeeds — null while PAYMENT_PENDING.
    invoice_number  VARCHAR(64),
    created_at      TIMESTAMP NOT NULL,
    paid_at         TIMESTAMP
);

CREATE INDEX idx_bill_franchise_id ON bill (franchise_id);

-- A line-item snapshot (product_name/unit_price copied at bill time), so a
-- later product edit never changes a past bill.
CREATE TABLE bill_item (
    id                UUID PRIMARY KEY,
    bill_id           UUID NOT NULL REFERENCES bill (id) ON DELETE CASCADE,
    -- Preserves the order items were added in (@OrderColumn) for invoice display.
    item_order        INTEGER NOT NULL,
    product_id        UUID NOT NULL REFERENCES product (id),
    product_name      VARCHAR(255) NOT NULL,
    unit_price        NUMERIC(12, 2) NOT NULL,
    quantity          INTEGER NOT NULL,
    gst_percentage    NUMERIC(5, 2) NOT NULL,
    line_subtotal     NUMERIC(12, 2) NOT NULL,
    line_gst_amount   NUMERIC(12, 2) NOT NULL,
    line_total        NUMERIC(12, 2) NOT NULL
);

CREATE INDEX idx_bill_item_bill_id ON bill_item (bill_id);

CREATE TABLE subscription_plan (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    price       NUMERIC(12, 2) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL
);

CREATE TABLE subscription_plan_feature (
    plan_id  UUID NOT NULL REFERENCES subscription_plan (id) ON DELETE CASCADE,
    feature  VARCHAR(64) NOT NULL,
    PRIMARY KEY (plan_id, feature)
);
