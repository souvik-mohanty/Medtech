-- A notification goes to exactly one recipient: either a franchise (owner)
-- or a patient (by email, same identity key used everywhere else in this
-- codebase) — never both, enforced in the application layer, not the DB,
-- matching how similarly-shaped "who is this for" columns work elsewhere.
CREATE TABLE notification (
    id UUID PRIMARY KEY,
    recipient_type VARCHAR(16) NOT NULL,
    franchise_id UUID REFERENCES franchise(id),
    patient_email VARCHAR(255),
    type VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_notification_franchise_id ON notification(franchise_id);
CREATE INDEX idx_notification_patient_email ON notification(patient_email);
