-- Referral management: doctors or anyone else who refers patients to the
-- lab, each with their own commission rate. Referred-by is only captured
-- on walk-in bookings (owner-entered), so lab_test_booking snapshots the
-- referral's name/commission at booking time — same "snapshot, don't
-- recompute later" convention as everything else on this table — so a
-- later change to the referral's commission rate never rewrites history.
CREATE TABLE referral (
    id UUID PRIMARY KEY,
    franchise_id UUID NOT NULL REFERENCES franchise(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'OTHER',
    phone VARCHAR(32),
    commission_type VARCHAR(16) NOT NULL DEFAULT 'PERCENTAGE',
    commission_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_referral_franchise_id ON referral(franchise_id);

ALTER TABLE lab_test_booking
    ADD COLUMN referral_id UUID REFERENCES referral(id),
    ADD COLUMN referral_name VARCHAR(255),
    ADD COLUMN referral_commission NUMERIC(12,2);
