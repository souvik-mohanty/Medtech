package com.company.medtech.consultation.dto;

import com.company.medtech.consultation.model.SlotType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
public class DoctorScheduleResponse {

    private String id;
    private String doctorName;
    private String doctorSpecialization;
    private LocalDate scheduleDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private SlotType slotType;
    private Integer maxPatients;
    private int bookedCount;
    /** Only meaningful for LIMITED — how many patients have been seen so far, plus one. FIFO queue position a new booking would join. */
    private Integer currentServingSerial;
    private BigDecimal fee;
    private boolean active;
}
