-- How much commission has actually been paid out to this referral so far.
-- Total earned isn't stored here — it's always computed live as the sum of
-- referral_commission across their lab bookings and bills (see
-- ReferralService#toResponse), so it can never drift out of sync.
ALTER TABLE referral ADD COLUMN settled_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
