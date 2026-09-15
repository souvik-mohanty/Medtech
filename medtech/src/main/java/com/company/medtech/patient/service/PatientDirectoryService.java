package com.company.medtech.patient.service;

import com.company.medtech.auth.model.UserAuth;
import com.company.medtech.auth.repository.UserAuthRepository;
import com.company.medtech.billing.model.Bill;
import com.company.medtech.billing.repository.BillRepository;
import com.company.medtech.consultation.model.DoctorAppointment;
import com.company.medtech.consultation.repository.DoctorAppointmentRepository;
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
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Owner-facing "who has done business with me" directory — composed from
 * lab bookings, medicine bills, and doctor appointments (grouped by
 * patient email) rather than a standalone patient table, same as the mock
 * did. Walk-in entries with no linked email carry no identity to group by
 * and are excluded here — they still show up in their own raw list pages
 * (Bookings/Orders/Walk-in Billing), just not folded into this directory.
 * There's no real concept of deactivating a patient account yet, so every
 * row currently reports ACTIVE.
 */
@Service
@Transactional(readOnly = true)
public class PatientDirectoryService {

    private final FranchiseService franchiseService;
    private final LabTestBookingRepository bookingRepository;
    private final BillRepository billRepository;
    private final DoctorAppointmentRepository doctorAppointmentRepository;
    private final UserAuthRepository userAuthRepository;
    private final PatientProfileRepository patientProfileRepository;

    public PatientDirectoryService(
            FranchiseService franchiseService,
            LabTestBookingRepository bookingRepository,
            BillRepository billRepository,
            DoctorAppointmentRepository doctorAppointmentRepository,
            UserAuthRepository userAuthRepository,
            PatientProfileRepository patientProfileRepository
    ) {
        this.franchiseService = franchiseService;
        this.bookingRepository = bookingRepository;
        this.billRepository = billRepository;
        this.doctorAppointmentRepository = doctorAppointmentRepository;
        this.userAuthRepository = userAuthRepository;
        this.patientProfileRepository = patientProfileRepository;
    }

    public List<PatientSummaryResponse> list(String ownerEmail, String search, String status) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);

        List<LabTestBooking> bookings = bookingRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId());
        List<Bill> bills = billRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId());
        List<DoctorAppointment> appointments = doctorAppointmentRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId());

        Set<String> emails = new HashSet<>();
        bookings.forEach(b -> { if (b.getPatientEmail() != null) emails.add(b.getPatientEmail()); });
        bills.forEach(b -> { if (b.getPatientEmail() != null) emails.add(b.getPatientEmail()); });
        appointments.forEach(a -> { if (a.getPatientEmail() != null) emails.add(a.getPatientEmail()); });

        List<PatientSummaryResponse> results = new ArrayList<>();
        for (String email : emails) {
            long bookingCount = bookings.stream().filter(b -> email.equals(b.getPatientEmail())).count();
            long orderCount = bills.stream().filter(b -> email.equals(b.getPatientEmail())).count();
            long appointmentCount = appointments.stream().filter(a -> email.equals(a.getPatientEmail())).count();

            LocalDate lastActivity = List.of(
                            bookings.stream().filter(b -> email.equals(b.getPatientEmail())).map(b -> b.getCreatedAt().toLocalDate()),
                            bills.stream().filter(b -> email.equals(b.getPatientEmail())).map(b -> b.getCreatedAt().toLocalDate()),
                            appointments.stream().filter(a -> email.equals(a.getPatientEmail())).map(a -> a.getCreatedAt().toLocalDate())
                    ).stream()
                    .flatMap(s -> s)
                    .max(LocalDate::compareTo)
                    .orElse(null);

            UserAuth user = userAuthRepository.findByEmail(email).orElse(null);
            String fullName = (user != null && user.getFullName() != null && !user.getFullName().isBlank())
                    ? user.getFullName() : email;
            String phone = user != null
                    ? patientProfileRepository.findByUserId(user.getId()).map(PatientProfile::getPhone).orElse(null)
                    : null;

            results.add(new PatientSummaryResponse(
                    user != null ? user.getId().toString() : email,
                    fullName,
                    phone,
                    email,
                    bookingCount,
                    orderCount,
                    appointmentCount,
                    lastActivity,
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

        results.sort(Comparator.comparing(PatientSummaryResponse::getLastActivityDate, Comparator.nullsLast(Comparator.reverseOrder())));
        return results;
    }
}
