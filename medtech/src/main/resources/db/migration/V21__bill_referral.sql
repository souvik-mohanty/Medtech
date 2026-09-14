-- A walk-in medicine/equipment purchase can also credit a referral, same as
-- walk-in lab bookings (see V19) — snapshotted at bill time so a later
-- change to the referral's commission rate never rewrites history.
ALTER TABLE bill
    ADD COLUMN referral_id UUID REFERENCES referral(id),
    ADD COLUMN referral_name VARCHAR(255),
    ADD COLUMN referral_commission NUMERIC(12,2);
