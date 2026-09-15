package com.company.medtech.patient.dto;

import lombok.Data;

/**
 * Owner-facing edit of a directory row — all fields optional, only what's
 * sent gets changed. For a real patient account, email updates the
 * contact email (PatientProfile#contactEmail), never the account's login
 * email; for a walk-in with no account, all three fields live directly on
 * their booking/order/appointment records instead — see
 * PatientDirectoryService#updateDetails.
 */
@Data
public class PatientUpdateRequest {

    private String fullName;
    private String phone;
    private String email;
}
