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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Owner-facing "who has done business with me" directory — composed from
 * lab bookings, medicine bills, and doctor appointments rather than a
 * standalone patient table, same as the mock did. A record with a real
 * patient email groups by that email (one row per account); a walk-in
 * (Express Billing) entry with no linked account has no email to group by,
 * so it groups instead by its own customer name + phone — one row per
 * distinct walk-in customer, so they show up here too, just without an
 * email. There's no real concept of deactivating a patient account yet, so
 * every row currently reports ACTIVE.
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

        Map<String, PatientGroup> groups = new LinkedHashMap<>();

        for (LabTestBooking b : bookings) {
            PatientGroup group = groupFor(groups, b.getPatientEmail(), b.getCustomerName(), b.getCustomerPhone());
            group.bookingCount++;
            group.touch(b.getCreatedAt().toLocalDate());
        }
        for (Bill b : bills) {
            PatientGroup group = groupFor(groups, b.getPatientEmail(), b.getCustomerName(), b.getCustomerPhone());
            group.orderCount++;
            group.touch(b.getCreatedAt().toLocalDate());
        }
        for (DoctorAppointment a : appointments) {
            PatientGroup group = groupFor(groups, a.getPatientEmail(), a.getCustomerName(), null);
            group.appointmentCount++;
            group.touch(a.getCreatedAt().toLocalDate());
        }

        List<PatientSummaryResponse> results = new ArrayList<>();
        for (PatientGroup group : groups.values()) {
            String id;
            String fullName;
            String phone;

            if (group.email != null) {
                UserAuth user = userAuthRepository.findByEmail(group.email).orElse(null);
                id = user != null ? user.getId().toString() : group.email;
                fullName = (user != null && user.getFullName() != null && !user.getFullName().isBlank())
                        ? user.getFullName() : group.email;
                phone = user != null
                        ? patientProfileRepository.findByUserId(user.getId()).map(PatientProfile::getPhone).orElse(group.customerPhone)
                        : group.customerPhone;
            } else {
                id = group.key.replace(':', '-');
                fullName = group.customerName != null ? group.customerName : "Walk-in customer";
                phone = group.customerPhone;
            }

            results.add(new PatientSummaryResponse(
                    id,
                    fullName,
                    phone,
                    group.email,
                    group.bookingCount,
                    group.orderCount,
                    group.appointmentCount,
                    group.lastActivity,
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

    private PatientGroup groupFor(Map<String, PatientGroup> groups, String email, String customerName, String customerPhone) {
        String key = keyFor(email, customerName, customerPhone);
        PatientGroup group = groups.computeIfAbsent(key, k -> {
            PatientGroup g = new PatientGroup();
            g.key = k;
            return g;
        });
        if (group.email == null && email != null && !email.isBlank()) {
            group.email = email.trim();
        }
        if (group.customerName == null && customerName != null && !customerName.isBlank()) {
            group.customerName = customerName.trim();
        }
        if (group.customerPhone == null && customerPhone != null && !customerPhone.isBlank()) {
            group.customerPhone = customerPhone.trim();
        }
        return group;
    }

    private String keyFor(String email, String customerName, String customerPhone) {
        if (email != null && !email.isBlank()) {
            return "email:" + email.trim().toLowerCase();
        }
        return "walkin:" + slug(customerName) + "-" + slug(customerPhone);
    }

    private String slug(String s) {
        if (s == null || s.isBlank()) {
            return "unknown";
        }
        String slug = s.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+)|(-+$)", "");
        return slug.isBlank() ? "unknown" : slug;
    }

    private static final class PatientGroup {
        String key;
        String email;
        String customerName;
        String customerPhone;
        long bookingCount;
        long orderCount;
        long appointmentCount;
        LocalDate lastActivity;

        void touch(LocalDate date) {
            if (lastActivity == null || date.isAfter(lastActivity)) {
                lastActivity = date;
            }
        }
    }
}
