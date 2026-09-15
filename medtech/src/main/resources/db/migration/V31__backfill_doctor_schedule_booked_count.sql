-- Old code only incremented booked_count for LIMITED schedules, leaving REQUEST
-- schedules stuck at 0 even with real bookings against them. Recompute from the
-- actual appointment rows so serial numbering continues correctly, not from 1 again.
UPDATE doctor_schedule ds
SET booked_count = (
    SELECT COUNT(*) FROM doctor_appointment da WHERE da.schedule_id = ds.id
)
WHERE booked_count <> (
    SELECT COUNT(*) FROM doctor_appointment da WHERE da.schedule_id = ds.id
);
