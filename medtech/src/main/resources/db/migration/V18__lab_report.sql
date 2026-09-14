-- One PDF report per booking, uploaded by the owner once processing is
-- done. Stored directly in Postgres (bytea) — no external file storage is
-- configured anywhere in this codebase, and reports are small enough that
-- a blob column is the simplest option consistent with how everything else
-- here persists.
CREATE TABLE lab_report (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL UNIQUE REFERENCES lab_test_booking(id),
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_data BYTEA NOT NULL,
    uploaded_at TIMESTAMP NOT NULL
);
