-- Extends the lab test catalog with the pathology-specific fields
-- lp-care-web's frontend expects (code/category/description/sample type/
-- preparation instructions/turnaround/prescription flag). `code` has no
-- safe backfill for any existing rows, so it stays nullable — uniqueness
-- is enforced at the service layer for newly-created tests only.
ALTER TABLE lab_test ADD COLUMN code VARCHAR(64);
ALTER TABLE lab_test ADD COLUMN category VARCHAR(32) NOT NULL DEFAULT 'ROUTINE_HEALTH';
ALTER TABLE lab_test ADD COLUMN description VARCHAR(2048);
ALTER TABLE lab_test ADD COLUMN sample_type VARCHAR(120);
ALTER TABLE lab_test ADD COLUMN preparation_instructions VARCHAR(2048);
ALTER TABLE lab_test ADD COLUMN report_turnaround_hours INTEGER NOT NULL DEFAULT 24;
ALTER TABLE lab_test ADD COLUMN prescription_required BOOLEAN NOT NULL DEFAULT FALSE;

-- combo_price already maps to TestPackage.discountedPrice; totalPrice stays
-- derived (sum of constituent lab_test.price at read time), same as the
-- frontend mock already computes it — no new column needed for that.
ALTER TABLE lab_test_combo ADD COLUMN description VARCHAR(2048);
ALTER TABLE lab_test_combo ADD COLUMN preparation_instructions VARCHAR(2048);
ALTER TABLE lab_test_combo ADD COLUMN report_turnaround_hours INTEGER NOT NULL DEFAULT 24;
