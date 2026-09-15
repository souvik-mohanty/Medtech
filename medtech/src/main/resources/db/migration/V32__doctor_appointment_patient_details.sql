-- Online bookings previously left the owner with only an email address to identify
-- who's coming in. Name and age are now captured at booking time. Nullable since
-- existing rows (and owner-entered walk-ins, which already capture customer_name)
-- predate this and aren't backfilled.
ALTER TABLE doctor_appointment ADD COLUMN patient_name VARCHAR(255);
ALTER TABLE doctor_appointment ADD COLUMN patient_age INTEGER;
