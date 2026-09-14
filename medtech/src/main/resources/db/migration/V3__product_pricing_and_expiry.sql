ALTER TABLE product RENAME COLUMN price TO selling_price;
ALTER TABLE product ADD COLUMN purchase_price NUMERIC(12, 2);
ALTER TABLE product ADD COLUMN mfg_date DATE;
ALTER TABLE product ADD COLUMN expiry_date DATE;

CREATE INDEX idx_product_franchise_expiry ON product (franchise_id, expiry_date);
