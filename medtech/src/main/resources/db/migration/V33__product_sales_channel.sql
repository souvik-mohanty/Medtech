-- Controls whether a product is offered to online patients, walk-in counter
-- sales, or both. Existing products default to BOTH (today's implicit behavior).
ALTER TABLE product ADD COLUMN sales_channel VARCHAR(16) NOT NULL DEFAULT 'BOTH';
