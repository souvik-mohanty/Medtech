-- Lab test bookings previously charged a hardcoded flat 5% GST on every
-- booking regardless of the actual test, with no way to configure or
-- disable it. GST is now per-test (optional, defaults to 0) and snapshotted
-- onto each booking item at booking time, same convention as item_name/amount.
ALTER TABLE lab_test ADD COLUMN gst_percentage NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE lab_test_booking_item ADD COLUMN gst_percentage NUMERIC(5,2) NOT NULL DEFAULT 0;
