-- Admin role removed: subscription plan catalog was admin-only management
-- with no enforcement anywhere, and there's no admin left to manage it.
DROP TABLE IF EXISTS subscription_plan_feature;
DROP TABLE IF EXISTS subscription_plan;

-- franchise_id was only ever set for Doctor/Lab Technician/Delivery Partner
-- accounts, all removed as login roles — the column is now fully dead.
DROP INDEX IF EXISTS idx_user_auth_franchise_id;
ALTER TABLE user_auth DROP COLUMN IF EXISTS franchise_id;
