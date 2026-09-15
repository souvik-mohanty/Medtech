package com.company.medtech.consultation.dto;

import com.company.medtech.billing.model.PaymentMode;
import com.company.medtech.common.enums.OrderStatus;
import com.company.medtech.consultation.model.SlotType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@AllArgsConstructor
public class DoctorAppointmentResponse {

    private String id;
    private String patientEmail;
    /** Only set on an owner-entered walk-in appointment with no linked patient account yet. */
    private String customerName;
    private String doctorName;
    private String doctorSpecialization;
    private LocalDate scheduleDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private SlotType slotType;
    private Integer serialNumber;
    private String mobileNumber;
    private String note;
    private BigDecimal fee;
    private PaymentMode paymentMode;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    /** Set by the owner once the doctor has actually seen this patient — independent of payment status. */
    private boolean completed;
    private LocalDateTime completedAt;
}
