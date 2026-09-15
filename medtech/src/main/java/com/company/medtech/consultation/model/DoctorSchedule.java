package com.company.medtech.consultation.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * A doctor's visiting window at a franchise — doctors aren't a login role,
 * this is data the franchise owner enters directly (name/specialization).
 * bookedCount is incremented atomically under a row lock as patients book —
 * see DoctorScheduleRepository#findByIdForUpdate / DoctorAppointmentService.
 */
@Entity
@Table(name = "doctor_schedule")
public class DoctorSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "franchise_id", nullable = false)
    private UUID franchiseId;

    @Column(name = "doctor_name", nullable = false)
    private String doctorName;

    @Column(name = "doctor_specialization")
    private String doctorSpecialization;

    @Column(name = "schedule_date", nullable = false)
    private LocalDate scheduleDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "slot_type", nullable = false)
    private SlotType slotType;

    /** Only meaningful for LIMITED — null for REQUEST. */
    @Column(name = "max_patients")
    private Integer maxPatients;

    @Column(name = "booked_count", nullable = false)
    private int bookedCount = 0;

    @Column(nullable = false)
    private BigDecimal fee;

    @Column(nullable = false)
    private boolean active = true;

    /** Null = bookable immediately. Otherwise patients can't book until this moment — gates DoctorAppointmentService#bookAppointment only, not owner walk-ins. */
    @Column(name = "booking_opens_at")
    private LocalDateTime bookingOpensAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getFranchiseId() {
        return franchiseId;
    }

    public void setFranchiseId(UUID franchiseId) {
        this.franchiseId = franchiseId;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getDoctorSpecialization() {
        return doctorSpecialization;
    }

    public void setDoctorSpecialization(String doctorSpecialization) {
        this.doctorSpecialization = doctorSpecialization;
    }

    public LocalDate getScheduleDate() {
        return scheduleDate;
    }

    public void setScheduleDate(LocalDate scheduleDate) {
        this.scheduleDate = scheduleDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public SlotType getSlotType() {
        return slotType;
    }

    public void setSlotType(SlotType slotType) {
        this.slotType = slotType;
    }

    public Integer getMaxPatients() {
        return maxPatients;
    }

    public void setMaxPatients(Integer maxPatients) {
        this.maxPatients = maxPatients;
    }

    public int getBookedCount() {
        return bookedCount;
    }

    public void setBookedCount(int bookedCount) {
        this.bookedCount = bookedCount;
    }

    public BigDecimal getFee() {
        return fee;
    }

    public void setFee(BigDecimal fee) {
        this.fee = fee;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getBookingOpensAt() {
        return bookingOpensAt;
    }

    public void setBookingOpensAt(LocalDateTime bookingOpensAt) {
        this.bookingOpensAt = bookingOpensAt;
    }
}
