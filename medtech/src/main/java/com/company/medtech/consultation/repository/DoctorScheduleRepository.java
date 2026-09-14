package com.company.medtech.consultation.repository;

import com.company.medtech.consultation.model.DoctorSchedule;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, UUID> {

    List<DoctorSchedule> findByFranchiseIdOrderByScheduleDateAscStartTimeAsc(UUID franchiseId);

    List<DoctorSchedule> findByFranchiseIdAndActiveTrueAndScheduleDateGreaterThanEqualOrderByScheduleDateAscStartTimeAsc(
            UUID franchiseId, LocalDate fromDate);

    Optional<DoctorSchedule> findByIdAndFranchiseId(UUID id, UUID franchiseId);

    /**
     * Row-locks the schedule so two concurrent LIMITED bookings can never be
     * assigned the same serial number or push bookedCount past maxPatients —
     * same idea as FranchiseRepository#findByIdForUpdate for invoice numbers.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from DoctorSchedule s where s.id = :id")
    Optional<DoctorSchedule> findByIdForUpdate(@Param("id") UUID id);
}
