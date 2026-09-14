package com.company.medtech.patient.service;

import com.company.medtech.auth.model.UserAuth;
import com.company.medtech.auth.repository.UserAuthRepository;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.lab.model.LabTestBooking;
import com.company.medtech.lab.repository.LabTestBookingRepository;
import com.company.medtech.patient.dto.PatientSummaryResponse;
import com.company.medtech.patient.model.PatientProfile;
import com.company.medtech.patient.repository.PatientProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Owner-facing "who has booked with me" directory — composed from booking
 * history rather than a standalone patient table, same as the mock does.
 * There's no real concept of deactivating a patient account yet, so every
 * row currently reports ACTIVE.
 */
@Service
@Transactional(readOnly = true)
public class PatientDirectoryService {

    private final FranchiseService franchiseService;
    private final LabTestBookingRepository bookingRepository;
    private final UserAuthRepository userAuthRepository;
    private final PatientProfileRepository patientProfileRepository;

    public PatientDirectoryService(
            FranchiseService franchiseService,
            LabTestBookingRepository bookingRepository,
            UserAuthRepository userAuthRepository,
            PatientProfileRepository patientProfileRepository
    ) {
        this.franchiseService = franchiseService;
        this.bookingRepository = bookingRepository;
        this.userAuthRepository = userAuthRepository;
        this.patientProfileRepository = patientProfileRepository;
    }

    public List<PatientSummaryResponse> list(String ownerEmail, String search, String status) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        List<LabTestBooking> bookings = bookingRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId());

        Map<String, List<LabTestBooking>> byPatientEmail = bookings.stream()
                .collect(Collectors.groupingBy(LabTestBooking::getPatientEmail));

        List<PatientSummaryResponse> results = new ArrayList<>();
        for (Map.Entry<String, List<LabTestBooking>> entry : byPatientEmail.entrySet()) {
            String email = entry.getKey();
            List<LabTestBooking> patientBookings = entry.getValue();

            UserAuth user = userAuthRepository.findByEmail(email).orElse(null);
            String fullName = (user != null && user.getFullName() != null && !user.getFullName().isBlank())
                    ? user.getFullName() : email;
            String phone = user != null
                    ? patientProfileRepository.findByUserId(user.getId()).map(PatientProfile::getPhone).orElse(null)
                    : null;
            LocalDate lastBookingDate = patientBookings.stream()
                    .map(b -> b.getCreatedAt().toLocalDate())
                    .max(LocalDate::compareTo)
                    .orElse(null);

            results.add(new PatientSummaryResponse(
                    user != null ? user.getId().toString() : email,
                    fullName,
                    phone,
                    email,
                    patientBookings.size(),
                    lastBookingDate,
                    "ACTIVE"
            ));
        }

        if (search != null && !search.isBlank()) {
            String term = search.toLowerCase();
            results = results.stream()
                    .filter(r -> r.getFullName().toLowerCase().contains(term)
                            || (r.getPhone() != null && r.getPhone().contains(term))
                            || (r.getEmail() != null && r.getEmail().toLowerCase().contains(term)))
                    .collect(Collectors.toCollection(ArrayList::new));
        }
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            results = results.stream()
                    .filter(r -> r.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toCollection(ArrayList::new));
        }

        results.sort(Comparator.comparing(PatientSummaryResponse::getLastBookingDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return results;
    }
}
