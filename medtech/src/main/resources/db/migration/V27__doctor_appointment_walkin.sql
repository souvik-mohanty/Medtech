ALTER TABLE doctor_appointment ALTER COLUMN patient_email DROP NOT NULL;
ALTER TABLE doctor_appointment ADD COLUMN customer_name VARCHAR(255);
