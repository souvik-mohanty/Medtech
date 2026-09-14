CREATE TABLE doctor_schedule (
    id                     UUID PRIMARY KEY,
    franchise_id           UUID NOT NULL REFERENCES franchise (id),
    doctor_name            VARCHAR(255) NOT NULL,
    doctor_specialization  VARCHAR(255),
    schedule_date          DATE NOT NULL,
    start_time             TIME NOT NULL,
    end_time               TIME NOT NULL,
    -- LIMITED: capped at max_patients, each booking gets the next serial
    -- number, patients are seen in that order during the window. REQUEST:
    -- unbounded "call me back" queue, no serial number, no cap.
    slot_type              VARCHAR(32) NOT NULL,
    max_patients           INTEGER,
    booked_count           INTEGER NOT NULL DEFAULT 0,
    fee                    NUMERIC(12, 2) NOT NULL,
    active                 BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_doctor_schedule_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_doctor_schedule_limited_has_max
        CHECK (slot_type <> 'LIMITED' OR max_patients IS NOT NULL)
);

CREATE INDEX idx_doctor_schedule_franchise_date ON doctor_schedule (franchise_id, schedule_date);

CREATE TABLE doctor_appointment (
    id             UUID PRIMARY KEY,
    franchise_id   UUID NOT NULL REFERENCES franchise (id),
    schedule_id    UUID NOT NULL REFERENCES doctor_schedule (id),
    patient_email  VARCHAR(255) NOT NULL,
    -- Only set for LIMITED schedules — see DoctorAppointmentService#bookAppointment.
    serial_number  INTEGER,
    mobile_number  VARCHAR(32) NOT NULL,
    note           VARCHAR(1024),
    -- Snapshot of doctor_schedule.fee at booking time, same idea as
    -- bill_item/lab_test_booking — a later schedule edit must never change
    -- a past appointment's fee.
    fee            NUMERIC(12, 2) NOT NULL,
    payment_mode   VARCHAR(32) NOT NULL,
    status         VARCHAR(32) NOT NULL,
    created_at     TIMESTAMP NOT NULL,
    paid_at        TIMESTAMP
);

CREATE INDEX idx_doctor_appointment_franchise_id ON doctor_appointment (franchise_id);
CREATE INDEX idx_doctor_appointment_schedule_id ON doctor_appointment (schedule_id);
