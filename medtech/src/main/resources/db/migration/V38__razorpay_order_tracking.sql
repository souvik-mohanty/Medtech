-- Online payment used to be mock-marked SUCCESS the instant a booking was
-- created — no real gateway interaction at all. Real Razorpay checkout
-- needs somewhere to remember which order it created (to open Checkout.js
-- against) and which payment the customer actually completed (to verify
-- the signature against). Both nullable: CASH payments never touch either.
ALTER TABLE payment ADD COLUMN razorpay_order_id VARCHAR(64);
ALTER TABLE payment ADD COLUMN razorpay_payment_id VARCHAR(64);
