-- Online medicine orders never captured a mobile number or delivery address,
-- so the owner had nothing but a bare email to go on. Snapshotted at order
-- time, same convention as lab_test_booking's address_* columns. Nullable —
-- only meaningfully populated for PATIENT_ONLINE bills; a counter/walk-in
-- sale already has customer_name/customer_phone captured directly.
ALTER TABLE bill ADD COLUMN mobile_number VARCHAR(32);
ALTER TABLE bill ADD COLUMN address_id UUID;
ALTER TABLE bill ADD COLUMN address_label VARCHAR(255);
ALTER TABLE bill ADD COLUMN address_line1 VARCHAR(255);
ALTER TABLE bill ADD COLUMN address_line2 VARCHAR(255);
ALTER TABLE bill ADD COLUMN address_city VARCHAR(255);
ALTER TABLE bill ADD COLUMN address_state VARCHAR(255);
ALTER TABLE bill ADD COLUMN address_pincode VARCHAR(32);
