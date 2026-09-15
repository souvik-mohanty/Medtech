package com.company.medtech.consultation.dto;

import com.company.medtech.consultation.model.SlotType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** maxPatients is required (and must be > 0) only when slotType is LIMITED — validated in the service. */
@Data
public class DoctorScheduleRequest {

    @NotBlank
    private String doctorName;

    private String doctorSpecialization;

    @NotNull
    private LocalDate scheduleDate;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @NotNull
    private SlotType slotType;

    @Min(1)
    private Integer maxPatients;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal fee;

    /** Optional — patients can't book until this moment. Null = bookable immediately. */
    private LocalDateTime bookingOpensAt;
}
