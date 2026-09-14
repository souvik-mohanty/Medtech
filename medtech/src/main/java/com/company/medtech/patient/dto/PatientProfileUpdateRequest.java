package com.company.medtech.patient.dto;

import com.company.medtech.patient.model.Gender;
import lombok.Data;

import java.time.LocalDate;

/** All fields optional — a caller only sends what it wants to change. */
@Data
public class PatientProfileUpdateRequest {

    private String fullName;
    private String phone;
    private String email;
    private Gender gender;
    private LocalDate dateOfBirth;
}
