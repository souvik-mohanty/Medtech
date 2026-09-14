-- V9's franchise provisioning used ON CONFLICT (owner_email) DO NOTHING,
-- so a pre-existing franchise row for this owner (created earlier under a
-- placeholder name, before this deployment settled on "LP Care Pathology")
-- silently kept its old name instead of being rebranded. Unlike V9's
-- user_auth upsert (which does update in place), this one only fires if
-- the name hasn't already been corrected.
UPDATE franchise
SET name = 'LP Care Pathology', accent_color_hex = '#1d4ed8', invoice_font = 'DEFAULT'
WHERE owner_email = 'souviksouvik2021@gmail.com' AND name <> 'LP Care Pathology';
