-- Lets a franchise have more than one owner-login email, without touching
-- franchise.owner_email (which stays the original/primary owner — used
-- everywhere unchanged). Additional co-owners are resolved through this
-- table only; see FranchiseService#getByOwnerEmail.
CREATE TABLE franchise_owner (
    id UUID PRIMARY KEY,
    franchise_id UUID NOT NULL REFERENCES franchise(id),
    owner_email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_franchise_owner_franchise_id ON franchise_owner(franchise_id);
