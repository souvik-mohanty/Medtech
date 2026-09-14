package com.company.medtech.patient.dto;

import com.company.medtech.patient.model.Gender;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class FamilyMemberResponse {

    private String id;
    private String fullName;
    private String relation;
    private Gender gender;
    private LocalDate dateOfBirth;
}
