package com.company.medtech.consultation.service;

import com.company.medtech.billing.model.PaymentMode;
import com.company.medtech.common.enums.OrderStatus;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.consultation.dto.DoctorAppointmentRequest;
import com.company.medtech.consultation.dto.DoctorAppointmentResponse;
import com.company.medtech.consultation.dto.WalkInAppointmentRequest;
import com.company.medtech.consultation.model.DoctorAppointment;
import com.company.medtech.consultation.model.DoctorSchedule;
import com.company.medtech.consultation.model.SlotType;
import com.company.medtech.consultation.repository.DoctorAppointmentRepository;
import com.company.medtech.consultation.repository.DoctorScheduleRepository;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import com.company.medtech.franchise.service.FranchiseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class DoctorAppointmentService {

    private final DoctorAppointmentRepository doctorAppointmentRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final FranchiseRepository franchiseRepository;
    private final FranchiseService franchiseService;

    public DoctorAppointmentService(
            DoctorAppointmentRepository doctorAppointmentRepository,
            DoctorScheduleRepository doctorScheduleRepository,
            FranchiseRepository franchiseRepository,
            FranchiseService franchiseService
    ) {
        this.doctorAppointmentRepository = doctorAppointmentRepository;
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.franchiseRepository = franchiseRepository;
        this.franchiseService = franchiseService;
    }

    /**
     * LIMITED schedules row-lock (findByIdForUpdate) so two concurrent
     * bookings can never get the same serial number or push bookedCount
     * past maxPatients. REQUEST schedules skip the lock entirely — an
     * unbounded "call me back" queue has nothing to serialize.
     */
    @Transactional
    public DoctorAppointmentResponse bookAppointment(String patientEmail, DoctorAppointmentRequest request) {
        UUID scheduleId = parseId(request.getScheduleId(), "DoctorSchedule");

        DoctorSchedule schedule = doctorScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", "id", request.getScheduleId()));

        if (!schedule.isActive()) {
            throw new BusinessException("This schedule is no longer open for booking");
        }

        UUID franchiseId = schedule.getFranchiseId();
        Franchise franchise = franchiseRepository.findById(franchiseId)
                .orElseThrow(() -> new ResourceNotFoundException("Franchise", "id", franchiseId.toString()));

        if (!franchise.isActive()) {
            throw new BusinessException("This store is currently unavailable.");
        }

        if (request.getPaymentMode() == PaymentMode.ONLINE && !franchise.hasActivePaymentGateway()) {
            throw new BusinessException(
                    "This store hasn't set up online payments yet. Choose cash payment instead.");
        }

        Integer serialNumber = null;
        if (schedule.getSlotType() == SlotType.LIMITED) {
            DoctorSchedule locked = doctorScheduleRepository.findByIdForUpdate(scheduleId)
                    .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", "id", request.getScheduleId()));
            if (locked.getBookedCount() >= locked.getMaxPatients()) {
                throw new BusinessException("This session is fully booked");
            }
            serialNumber = locked.getBookedCount() + 1;
            locked.setBookedCount(serialNumber);
            doctorScheduleRepository.save(locked);
            schedule = locked;
        }

        DoctorAppointment appointment = new DoctorAppointment();
        appointment.setFranchiseId(franchise.getId());
        appointment.setScheduleId(schedule.getId());
        appointment.setPatientEmail(patientEmail);
        appointment.setSerialNumber(serialNumber);
        appointment.setMobileNumber(request.getMobileNumber());
        appointment.setNote(request.getNote());
        appointment.setFee(schedule.getFee());
        appointment.setPaymentMode(request.getPaymentMode());
        LocalDateTime now = LocalDateTime.now();
        boolean isCash = request.getPaymentMode() == PaymentMode.CASH;
        appointment.setStatus(isCash ? OrderStatus.PAYMENT_PENDING : OrderStatus.PAID);
        appointment.setCreatedAt(now);
        appointment.setPaidAt(isCash ? null : now);

        return toResponse(doctorAppointmentRepository.save(appointment), schedule);
    }

    /**
     * Owner action — books a walk-in patient at the counter against one of
     * their own schedules. Always cash; no online-gateway check needed since
     * the patient is physically present. Mirrors lab's createWalkInBooking:
     * patientEmail is optional and, if given, makes this appointment visible
     * once that email later logs in (see DoctorAppointmentRepository#findByPatientEmailOrderByCreatedAtDesc).
     */
    @Transactional
    public DoctorAppointmentResponse bookWalkInAppointment(String ownerEmail, WalkInAppointmentRequest request) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        UUID scheduleId = parseId(request.getScheduleId(), "DoctorSchedule");

        DoctorSchedule schedule = doctorScheduleRepository.findByIdAndFranchiseId(scheduleId, franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", "id", request.getScheduleId()));

        if (!schedule.isActive()) {
            throw new BusinessException("This schedule is no longer open for booking");
        }

        Integer serialNumber = null;
        if (schedule.getSlotType() == SlotType.LIMITED) {
            DoctorSchedule locked = doctorScheduleRepository.findByIdForUpdate(scheduleId)
                    .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", "id", request.getScheduleId()));
            if (locked.getBookedCount() >= locked.getMaxPatients()) {
                throw new BusinessException("This session is fully booked");
            }
            serialNumber = locked.getBookedCount() + 1;
            locked.setBookedCount(serialNumber);
            doctorScheduleRepository.save(locked);
            schedule = locked;
        }

        String patientEmail = request.getPatientEmail() != null && !request.getPatientEmail().isBlank()
                ? request.getPatientEmail().trim().toLowerCase()
                : null;

        DoctorAppointment appointment = new DoctorAppointment();
        appointment.setFranchiseId(franchise.getId());
        appointment.setScheduleId(schedule.getId());
        appointment.setPatientEmail(patientEmail);
        appointment.setCustomerName(request.getCustomerName());
        appointment.setSerialNumber(serialNumber);
        appointment.setMobileNumber(request.getMobileNumber());
        appointment.setNote(request.getNote());
        appointment.setFee(schedule.getFee());
        appointment.setPaymentMode(PaymentMode.CASH);
        LocalDateTime now = LocalDateTime.now();
        appointment.setStatus(request.isPaidNow() ? OrderStatus.PAID : OrderStatus.PAYMENT_PENDING);
        appointment.setCreatedAt(now);
        appointment.setPaidAt(request.isPaidNow() ? now : null);

        return toResponse(doctorAppointmentRepository.save(appointment), schedule);
    }

    @Transactional(readOnly = true)
    public List<DoctorAppointmentResponse> listForOwner(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return doctorAppointmentRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId())
                .stream()
                .map(this::toResponseWithSchedule)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DoctorAppointmentResponse> listForPatient(String patientEmail) {
        return doctorAppointmentRepository.findByPatientEmailOrderByCreatedAtDesc(patientEmail)
                .stream()
                .map(this::toResponseWithSchedule)
                .toList();
    }

    /** The franchise owner confirming a CASH appointment was actually paid at the visit. */
    public DoctorAppointmentResponse markPaid(String ownerEmail, String appointmentId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        DoctorAppointment appointment = doctorAppointmentRepository
                .findByIdAndFranchiseId(parseId(appointmentId, "Appointment"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        if (appointment.getStatus() != OrderStatus.PAID) {
            appointment.setStatus(OrderStatus.PAID);
            appointment.setPaidAt(LocalDateTime.now());
            doctorAppointmentRepository.save(appointment);
        }

        return toResponseWithSchedule(appointment);
    }

    /** The franchise owner marking a consultation as done, once the doctor has actually seen the patient. */
    @Transactional
    public DoctorAppointmentResponse markCompleted(String ownerEmail, String appointmentId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        DoctorAppointment appointment = doctorAppointmentRepository
                .findByIdAndFranchiseId(parseId(appointmentId, "Appointment"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        if (!appointment.isCompleted()) {
            appointment.setCompleted(true);
            appointment.setCompletedAt(LocalDateTime.now());
            doctorAppointmentRepository.save(appointment);
        }

        return toResponseWithSchedule(appointment);
    }

    private UUID parseId(String id, String resourceName) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException(resourceName, "id", id);
        }
    }

    private DoctorAppointmentResponse toResponseWithSchedule(DoctorAppointment appointment) {
        DoctorSchedule schedule = doctorScheduleRepository.findById(appointment.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("DoctorSchedule", "id", appointment.getScheduleId().toString()));
        return toResponse(appointment, schedule);
    }

    private DoctorAppointmentResponse toResponse(DoctorAppointment appointment, DoctorSchedule schedule) {
        return new DoctorAppointmentResponse(
                appointment.getId().toString(),
                appointment.getPatientEmail(),
                appointment.getCustomerName(),
                schedule.getDoctorName(),
                schedule.getDoctorSpecialization(),
                schedule.getScheduleDate(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getSlotType(),
                appointment.getSerialNumber(),
                appointment.getMobileNumber(),
                appointment.getNote(),
                appointment.getFee(),
                appointment.getPaymentMode(),
                appointment.getStatus(),
                appointment.getCreatedAt(),
                appointment.getPaidAt(),
                appointment.isCompleted(),
                appointment.getCompletedAt()
        );
    }
}
