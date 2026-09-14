-- Captures the signed-in user's Google profile name/picture (previously
-- not stored at all), plus a real patient profile: contact details,
-- addresses, and family members — replacing lp-care-web's mock data with
-- persistent Postgres-backed equivalents. See GoogleOAuthService#login,
-- which now upserts full_name/picture_url on every login (not just at
-- first provisioning), so this fills in automatically — no backfill needed.
ALTER TABLE user_auth ADD COLUMN full_name VARCHAR(255);
ALTER TABLE user_auth ADD COLUMN picture_url VARCHAR(1024);

-- 1:1 with user_auth, patient-only in practice (a FRANCHISE row can have
-- one too, but nothing reads it for that role). full_name stays on
-- user_auth as the single source of truth for both roles, not duplicated
-- here.
CREATE TABLE patient_profile (
    id            UUID PRIMARY KEY,
    user_id       UUID NOT NULL UNIQUE REFERENCES user_auth (id),
    phone         VARCHAR(32),
    contact_email VARCHAR(255),
    gender        VARCHAR(16),
    date_of_birth DATE,
    created_at    TIMESTAMP NOT NULL
);

CREATE TABLE patient_address (
    id                  UUID PRIMARY KEY,
    patient_profile_id  UUID NOT NULL REFERENCES patient_profile (id),
    label               VARCHAR(64) NOT NULL,
    line1               VARCHAR(255) NOT NULL,
    line2               VARCHAR(255),
    city                VARCHAR(120) NOT NULL,
    state               VARCHAR(120) NOT NULL,
    pincode             VARCHAR(12) NOT NULL,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_patient_address_profile_id ON patient_address (patient_profile_id);

-- At most one default address per patient.
CREATE UNIQUE INDEX uq_patient_address_default ON patient_address (patient_profile_id) WHERE is_default;

CREATE TABLE family_member (
    id                  UUID PRIMARY KEY,
    patient_profile_id  UUID NOT NULL REFERENCES patient_profile (id),
    full_name           VARCHAR(255) NOT NULL,
    relation            VARCHAR(64) NOT NULL,
    gender              VARCHAR(16) NOT NULL,
    date_of_birth       DATE NOT NULL
);

CREATE INDEX idx_family_member_profile_id ON family_member (patient_profile_id);

-- Provision the one FRANCHISE (lab owner) account this deployment needs —
-- there is deliberately no self-service/admin path for this role (see
-- GoogleOAuthService). full_name is left NULL if this is a fresh insert;
-- it fills in automatically from the Google profile the first time this
-- email signs in. ON CONFLICT handles the case where this email already
-- signed in once before this migration ran (auto-provisioned as PATIENT,
-- as Google Sign-In does for any unrecognized email) — promote that
-- existing row to FRANCHISE in place rather than fail on the unique
-- constraint; its id and any already-captured full_name/picture_url are
-- left untouched.
INSERT INTO user_auth (id, email, role, active)
VALUES ('50576d14-447f-446e-a5c4-8bf2f91a7231', 'souviksouvik2021@gmail.com', 'FRANCHISE', TRUE)
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, active = EXCLUDED.active;

INSERT INTO franchise (id, owner_email, name, accent_color_hex, invoice_font, active)
VALUES ('a65eb4c9-d129-4fb6-beff-c13a81e1f1da', 'souviksouvik2021@gmail.com', 'LP Care Pathology', '#1d4ed8', 'DEFAULT', TRUE)
ON CONFLICT (owner_email) DO NOTHING;
