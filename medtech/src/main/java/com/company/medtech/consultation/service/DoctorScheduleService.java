package com.company.medtech.consultation.service;

import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.consultation.dto.DoctorScheduleRequest;
import com.company.medtech.consultation.dto.DoctorScheduleResponse;
import com.company.medtech.consultation.model.DoctorSchedule;
import com.company.medtech.consultation.model.SlotType;
import com.company.medtech.consultation.repository.DoctorScheduleRepository;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class DoctorScheduleService {

    private final DoctorScheduleRepository doctorScheduleRepository;
    private final FranchiseService franchiseService;

    public DoctorScheduleService(DoctorScheduleRepository doctorScheduleRepository, FranchiseService franchiseService) {
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.franchiseService = franchiseService;
    }

    public DoctorScheduleResponse create(String ownerEmail, DoctorScheduleRequest request) {
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BusinessException("End time must be after start time");
        }
        if (request.getSlotType() == SlotType.LIMITED && (request.getMaxPatients() == null || request.getMaxPatients() < 1)) {
            throw new BusinessException("Limited schedules need a maximum patient count");
        }

        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);

        DoctorSchedule schedule = new DoctorSchedule();
        schedule.setFranchiseId(franchise.getId());
        schedule.setDoctorName(request.getDoctorName());
        schedule.setDoctorSpecialization(request.getDoctorSpecialization());
        schedule.setScheduleDate(request.getScheduleDate());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setSlotType(request.getSlotType());
        schedule.setMaxPatients(request.getSlotType() == SlotType.LIMITED ? request.getMaxPatients() : null);
        schedule.setFee(request.getFee());
        schedule.setActive(true);

        return toResponse(doctorScheduleRepository.save(schedule));
    }

    public List<DoctorScheduleResponse> listForOwner(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return doctorScheduleRepository.findByFranchiseIdOrderByScheduleDateAscStartTimeAsc(franchise.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** Patient-facing — only active, upcoming (today or later) schedules. */
    public List<DoctorScheduleResponse> listForFranchise(String franchiseId) {
        UUID id = parseId(franchiseId, "Franchise");
        return doctorScheduleRepository
                .findByFranchiseIdAndActiveTrueAndScheduleDateGreaterThanEqualOrderByScheduleDateAscStartTimeAsc(id, LocalDate.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private UUID parseId(String id, String resourceName) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException(resourceName, "id", id);
        }
    }

    private DoctorScheduleResponse toResponse(DoctorSchedule schedule) {
        return new DoctorScheduleResponse(
                schedule.getId().toString(),
                schedule.getDoctorName(),
                schedule.getDoctorSpecialization(),
                schedule.getScheduleDate(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getSlotType(),
                schedule.getMaxPatients(),
                schedule.getBookedCount(),
                schedule.getFee(),
                schedule.isActive()
        );
    }
}
