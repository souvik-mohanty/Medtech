package com.company.medtech.patient.dto;

import com.company.medtech.patient.model.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class FamilyMemberRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    private String relation;

    @NotNull
    private Gender gender;

    @NotNull
    private LocalDate dateOfBirth;
}
