package com.company.medtech.lab.service;

import com.company.medtech.billing.model.PaymentMode;
import com.company.medtech.common.enums.OrderStatus;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.lab.dto.LabTestBookingRequest;
import com.company.medtech.lab.dto.LabTestBookingResponse;
import com.company.medtech.lab.model.LabTest;
import com.company.medtech.lab.model.LabTestBooking;
import com.company.medtech.lab.model.LabTestCombo;
import com.company.medtech.lab.repository.LabTestBookingRepository;
import com.company.medtech.lab.repository.LabTestComboRepository;
import com.company.medtech.lab.repository.LabTestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class LabTestBookingService {

    private final LabTestBookingRepository labTestBookingRepository;
    private final LabTestRepository labTestRepository;
    private final LabTestComboRepository labTestComboRepository;
    private final FranchiseRepository franchiseRepository;
    private final FranchiseService franchiseService;

    public LabTestBookingService(
            LabTestBookingRepository labTestBookingRepository,
            LabTestRepository labTestRepository,
            LabTestComboRepository labTestComboRepository,
            FranchiseRepository franchiseRepository,
            FranchiseService franchiseService
    ) {
        this.labTestBookingRepository = labTestBookingRepository;
        this.labTestRepository = labTestRepository;
        this.labTestComboRepository = labTestComboRepository;
        this.franchiseRepository = franchiseRepository;
        this.franchiseService = franchiseService;
    }

    /**
     * A patient booking either a single test or a combo (exactly one of
     * labTestId/comboId, enforced here before it ever reaches the DB check
     * constraint). ONLINE requires the franchise to have an active payment
     * gateway, same rule as BillingService#createOnlineOrder; CASH is always
     * allowed and starts PAYMENT_PENDING too — it only becomes PAID once the
     * franchise owner confirms the patient paid in person, via #markPaid.
     * No real payment gateway is wired up yet, so ONLINE also lands in
     * PAYMENT_PENDING for now (same caveat as online medicine orders).
     */
    @Transactional
    public LabTestBookingResponse bookTest(String patientEmail, LabTestBookingRequest request) {
        boolean hasTest = request.getLabTestId() != null && !request.getLabTestId().isBlank();
        boolean hasCombo = request.getComboId() != null && !request.getComboId().isBlank();
        if (hasTest == hasCombo) {
            throw new BusinessException("Book exactly one test or one combo");
        }

        UUID franchiseId = parseId(request.getFranchiseId(), "Franchise");
        Franchise franchise = franchiseRepository.findById(franchiseId)
                .orElseThrow(() -> new ResourceNotFoundException("Franchise", "id", request.getFranchiseId()));

        if (!franchise.isActive()) {
            throw new BusinessException("This store is currently unavailable.");
        }

        if (request.getPaymentMode() == PaymentMode.ONLINE && !franchise.hasActivePaymentGateway()) {
            throw new BusinessException(
                    "This store hasn't set up online payments yet. Choose cash payment instead.");
        }

        LabTestBooking booking = new LabTestBooking();
        booking.setFranchiseId(franchise.getId());
        booking.setPatientEmail(patientEmail);
        booking.setAddress(request.getAddress());
        booking.setMobileNumber(request.getMobileNumber());
        booking.setPaymentMode(request.getPaymentMode());
        booking.setStatus(OrderStatus.PAYMENT_PENDING);
        booking.setCreatedAt(LocalDateTime.now());

        if (hasTest) {
            UUID testId = parseId(request.getLabTestId(), "LabTest");
            LabTest test = labTestRepository.findByIdAndFranchiseId(testId, franchise.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("LabTest", "id", request.getLabTestId()));
            booking.setLabTestId(test.getId());
            booking.setItemName(test.getName());
            booking.setAmount(test.getPrice());
        } else {
            UUID comboId = parseId(request.getComboId(), "LabTestCombo");
            LabTestCombo combo = labTestComboRepository.findByIdAndFranchiseId(comboId, franchise.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("LabTestCombo", "id", request.getComboId()));
            booking.setComboId(combo.getId());
            booking.setItemName(combo.getName());
            booking.setAmount(combo.getComboPrice());
        }

        return toResponse(labTestBookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<LabTestBookingResponse> listForOwner(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return labTestBookingRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /** The franchise owner confirming a CASH booking was actually paid at the visit. */
    public LabTestBookingResponse markPaid(String ownerEmail, String bookingId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestBooking booking = labTestBookingRepository.findByIdAndFranchiseId(parseId(bookingId, "Booking"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (booking.getStatus() != OrderStatus.PAID) {
            booking.setStatus(OrderStatus.PAID);
            booking.setPaidAt(LocalDateTime.now());
            labTestBookingRepository.save(booking);
        }

        return toResponse(booking);
    }

    private UUID parseId(String id, String resourceName) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException(resourceName, "id", id);
        }
    }

    private LabTestBookingResponse toResponse(LabTestBooking booking) {
        return new LabTestBookingResponse(
                booking.getId().toString(),
                booking.getPatientEmail(),
                booking.getItemName(),
                booking.getAmount(),
                booking.getAddress(),
                booking.getMobileNumber(),
                booking.getPaymentMode(),
                booking.getStatus(),
                booking.getCreatedAt(),
                booking.getPaidAt()
        );
    }
}
