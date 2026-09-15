package com.company.medtech.consultation.service;

import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.consultation.dto.DoctorScheduleRequest;
import com.company.medtech.consultation.dto.DoctorScheduleResponse;
import com.company.medtech.consultation.model.DoctorSchedule;
import com.company.medtech.consultation.model.SlotType;
import com.company.medtech.consultation.repository.DoctorAppointmentRepository;
import com.company.medtech.consultation.repository.DoctorScheduleRepository;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class DoctorScheduleService {

    private final DoctorScheduleRepository doctorScheduleRepository;
    private final DoctorAppointmentRepository doctorAppointmentRepository;
    private final FranchiseService franchiseService;

    public DoctorScheduleService(
            DoctorScheduleRepository doctorScheduleRepository,
            DoctorAppointmentRepository doctorAppointmentRepository,
            FranchiseService franchiseService
    ) {
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.doctorAppointmentRepository = doctorAppointmentRepository;
        this.franchiseService = franchiseService;
    }

    public DoctorScheduleResponse create(String ownerEmail, DoctorScheduleRequest request) {
        if (request.getScheduleDate().isBefore(LocalDate.now())) {
            throw new BusinessException("Schedule date cannot be in the past");
        }
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
        schedule.setBookingOpensAt(request.getBookingOpensAt());

        return toResponse(doctorScheduleRepository.save(schedule));
    }

    public DoctorScheduleResponse update(String ownerEmail, String scheduleId, DoctorScheduleRequest request) {
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BusinessException("End time must be after start time");
        }
        if (request.getSlotType() == SlotType.LIMITED && (request.getMaxPatients() == null || request.getMaxPatients() < 1)) {
            throw new BusinessException("Limited schedules need a maximum patient count");
        }

        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        DoctorSchedule schedule = doctorScheduleRepository.findByIdAndFranchiseId(parseId(scheduleId, "DoctorSchedule"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", "id", scheduleId));

        schedule.setDoctorName(request.getDoctorName());
        schedule.setDoctorSpecialization(request.getDoctorSpecialization());
        schedule.setScheduleDate(request.getScheduleDate());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setSlotType(request.getSlotType());
        schedule.setMaxPatients(request.getSlotType() == SlotType.LIMITED ? request.getMaxPatients() : null);
        schedule.setFee(request.getFee());
        schedule.setBookingOpensAt(request.getBookingOpensAt());

        return toResponse(doctorScheduleRepository.save(schedule));
    }

    /** Owner action — stops (or resumes) new bookings against this schedule without deleting it. */
    public DoctorScheduleResponse toggleActive(String ownerEmail, String scheduleId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        DoctorSchedule schedule = doctorScheduleRepository.findByIdAndFranchiseId(parseId(scheduleId, "DoctorSchedule"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", "id", scheduleId));
        schedule.setActive(!schedule.isActive());
        return toResponse(doctorScheduleRepository.save(schedule));
    }

    public List<DoctorScheduleResponse> listForOwner(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return doctorScheduleRepository.findByFranchiseIdOrderByScheduleDateAscStartTimeAsc(franchise.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Patient-facing — only active, upcoming schedules. The date filter alone lets a
     * today-dated schedule through even after its end time has passed, so that's
     * checked here too — the moment a schedule's window ends, it stops being offered
     * for booking (both online and walk-in — see DoctorAppointmentService).
     */
    public List<DoctorScheduleResponse> listForFranchise(String franchiseId) {
        UUID id = parseId(franchiseId, "Franchise");
        LocalDateTime now = LocalDateTime.now();
        return doctorScheduleRepository
                .findByFranchiseIdAndActiveTrueAndScheduleDateGreaterThanEqualOrderByScheduleDateAscStartTimeAsc(id, LocalDate.now())
                .stream()
                .filter(s -> LocalDateTime.of(s.getScheduleDate(), s.getEndTime()).isAfter(now))
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
        // Meaningful for REQUEST too — an unbounded "call to arrange" queue still has a real serving order.
        int currentServingSerial = (int) doctorAppointmentRepository.countByScheduleIdAndCompletedTrue(schedule.getId()) + 1;
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
                currentServingSerial,
                schedule.getFee(),
                schedule.isActive(),
                schedule.getBookingOpensAt()
        );
    }
}
