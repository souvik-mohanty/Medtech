package com.company.medtech.patient.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

/** Owner-facing summary row — deliberately excludes sensitive medical detail. */
@Data
@AllArgsConstructor
public class PatientSummaryResponse {

    private String id;
    private String fullName;
    private String phone;
    private String email;
    private long totalBookings;
    private LocalDate lastBookingDate;
    private String status;
}
