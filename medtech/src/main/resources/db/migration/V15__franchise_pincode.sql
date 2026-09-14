-- Serviceable pincodes the owner configures in Settings. Backed by a JPA
-- @ElementCollection (Set<String> on Franchise), not a standalone entity —
-- there's no need to CRUD a pincode individually, only replace the whole set.
-- Empty for a franchise = no restriction configured yet (service everywhere),
-- see FranchiseService#assertPincodeServiceable.
CREATE TABLE franchise_pincode (
    franchise_id UUID NOT NULL REFERENCES franchise(id),
    pincode VARCHAR(20) NOT NULL,
    PRIMARY KEY (franchise_id, pincode)
);
