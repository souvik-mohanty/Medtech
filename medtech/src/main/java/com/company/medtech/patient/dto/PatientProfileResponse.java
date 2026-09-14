package com.company.medtech.patient.dto;

import com.company.medtech.patient.model.Gender;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class PatientProfileResponse {

    private String id;
    private String fullName;
    private String phone;
    private String email;
    private Gender gender;
    private LocalDate dateOfBirth;
    private List<AddressResponse> addresses;
    private List<FamilyMemberResponse> familyMembers;
    private LocalDateTime createdAt;
}
