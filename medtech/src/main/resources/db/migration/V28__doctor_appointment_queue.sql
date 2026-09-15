ALTER TABLE doctor_appointment
    ADD COLUMN completed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN completed_at TIMESTAMP;
