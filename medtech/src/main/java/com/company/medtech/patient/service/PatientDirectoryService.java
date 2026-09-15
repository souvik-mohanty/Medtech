package com.company.medtech.patient.service;

import com.company.medtech.auth.model.UserAuth;
import com.company.medtech.auth.repository.UserAuthRepository;
import com.company.medtech.billing.model.Bill;
import com.company.medtech.billing.repository.BillRepository;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.consultation.model.DoctorAppointment;
import com.company.medtech.consultation.repository.DoctorAppointmentRepository;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.lab.model.LabTestBooking;
import com.company.medtech.lab.repository.LabTestBookingRepository;
import com.company.medtech.patient.dto.PatientSummaryResponse;
import com.company.medtech.patient.dto.PatientUpdateRequest;
import com.company.medtech.patient.model.PatientProfile;
import com.company.medtech.patient.repository.PatientProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Owner-facing "who has done business with me" directory — composed from
 * lab bookings, medicine bills, and doctor appointments rather than a
 * standalone patient table, same as the mock did.
 *
 * A record with a real patient email groups by that email (one row per
 * account) — the strongest identity signal, since a logged-in patient's
 * every record carries the exact same email. A walk-in (Express Billing)
 * entry with no email groups instead by its own customer name + phone.
 * The two schemes are unioned together (see #unionByIdentity) so the same
 * physical person is never split across rows just because the owner
 * happened to enter an email on one visit and only a name + phone on
 * another — any two records that share an email, OR share both name and
 * phone, are folded into one row, transitively. There's no real concept of
 * deactivating a patient account yet, so every row currently reports
 * ACTIVE.
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
        Grouping grouping = group(franchise);

        List<PatientSummaryResponse> results = grouping.groups.values().stream()
                .map(this::toResponse)
                .collect(Collectors.toCollection(ArrayList::new));

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

    /**
     * Owner-facing edit — updates a directory row's name/phone/(contact)
     * email. A real account routes fullName to UserAuth and phone/email to
     * that account's PatientProfile (contact email only, never the login
     * email, so this can never lock a patient out of signing in) and never
     * touches their raw booking/bill/appointment rows, since every display
     * already resolves those dynamically from the profile. A walk-in has
     * no account to hold this, so the edit is written directly onto every
     * booking/bill/appointment row this directory row was built from.
     */
    @Transactional
    public PatientSummaryResponse updateDetails(String ownerEmail, String patientId, PatientUpdateRequest request) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        Grouping grouping = group(franchise);

        Map.Entry<Integer, PatientGroup> target = grouping.groups.entrySet().stream()
                .filter(e -> toResponse(e.getValue()).getId().equals(patientId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));

        PatientGroup group = target.getValue();
        UserAuth user = group.email != null ? userAuthRepository.findByEmail(group.email).orElse(null) : null;

        if (user != null) {
            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                user.setFullName(request.getFullName().trim());
                userAuthRepository.save(user);
            }
            PatientProfile profile = null;
            if (request.getPhone() != null) {
                profile = getOrCreateProfile(user.getId());
                profile.setPhone(request.getPhone().isBlank() ? null : request.getPhone().trim());
            }
            if (request.getEmail() != null) {
                profile = profile != null ? profile : getOrCreateProfile(user.getId());
                profile.setContactEmail(request.getEmail().isBlank() ? null : request.getEmail().trim());
            }
            if (profile != null) {
                patientProfileRepository.save(profile);
            }
        } else {
            applyToRecords(grouping.signals, grouping.parent, target.getKey(), request.getFullName(), request.getPhone(), request.getEmail());
        }

        // Anchor on one of the group's own record ids (stable across the edit) rather than the
        // derived id, since a walk-in's id is itself computed from name+phone and can change here.
        UUID anchorId = group.recordIds.stream().findFirst().orElse(null);

        Grouping after = group(franchise);
        return after.groups.values().stream()
                .filter(g -> g.recordIds.contains(anchorId))
                .findFirst()
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));
    }

    private PatientProfile getOrCreateProfile(UUID userId) {
        return patientProfileRepository.findByUserId(userId).orElseGet(() -> {
            PatientProfile profile = new PatientProfile();
            profile.setUserId(userId);
            return profile;
        });
    }

    private void applyToRecords(List<Signal> signals, int[] parent, int targetRoot, String name, String phone, String email) {
        for (int i = 0; i < signals.size(); i++) {
            if (find(parent, i) != targetRoot) {
                continue;
            }
            Signal s = signals.get(i);
            String newName = name != null && !name.isBlank() ? name.trim() : null;
            String newPhone = phone != null ? (phone.isBlank() ? null : phone.trim()) : null;
            String newEmail = email != null ? (email.isBlank() ? null : email.trim().toLowerCase()) : null;

            switch (s.kind()) {
                case BOOKING -> {
                    LabTestBooking b = (LabTestBooking) s.source();
                    if (newName != null) b.setCustomerName(newName);
                    if (phone != null) b.setCustomerPhone(newPhone);
                    if (email != null) b.setPatientEmail(newEmail);
                    bookingRepository.save(b);
                }
                case ORDER -> {
                    Bill b = (Bill) s.source();
                    if (newName != null) b.setCustomerName(newName);
                    if (phone != null) b.setCustomerPhone(newPhone);
                    if (email != null) b.setPatientEmail(newEmail);
                    billRepository.save(b);
                }
                case APPOINTMENT -> {
                    DoctorAppointment a = (DoctorAppointment) s.source();
                    if (newName != null) a.setCustomerName(newName);
                    if (email != null) a.setPatientEmail(newEmail);
                    doctorAppointmentRepository.save(a);
                }
            }
        }
    }

    private Grouping group(Franchise franchise) {
        List<LabTestBooking> bookings = bookingRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId());
        List<Bill> bills = billRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId());
        List<DoctorAppointment> appointments = doctorAppointmentRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId());

        List<Signal> signals = new ArrayList<>();
        for (LabTestBooking b : bookings) {
            signals.add(new Signal(b.getPatientEmail(), b.getCustomerName(), b.getCustomerPhone(), b.getCreatedAt().toLocalDate(), RecordKind.BOOKING, b));
        }
        for (Bill b : bills) {
            signals.add(new Signal(b.getPatientEmail(), b.getCustomerName(), b.getCustomerPhone(), b.getCreatedAt().toLocalDate(), RecordKind.ORDER, b));
        }
        for (DoctorAppointment a : appointments) {
            signals.add(new Signal(a.getPatientEmail(), a.getCustomerName(), null, a.getCreatedAt().toLocalDate(), RecordKind.APPOINTMENT, a));
        }

        int[] parent = unionByIdentity(signals);

        Map<Integer, PatientGroup> groups = new LinkedHashMap<>();
        for (int i = 0; i < signals.size(); i++) {
            int root = find(parent, i);
            PatientGroup group = groups.computeIfAbsent(root, k -> new PatientGroup());
            Signal s = signals.get(i);
            switch (s.kind) {
                case BOOKING -> group.bookingCount++;
                case ORDER -> group.orderCount++;
                case APPOINTMENT -> group.appointmentCount++;
            }
            group.touch(s.date);
            UUID recordId = idOf(s);
            if (recordId != null) {
                group.recordIds.add(recordId);
            }
            if (group.email == null && s.email != null && !s.email.isBlank()) {
                group.email = s.email.trim();
            }
            if (group.customerName == null && s.customerName != null && !s.customerName.isBlank()) {
                group.customerName = s.customerName.trim();
            }
            if (group.customerPhone == null && s.customerPhone != null && !s.customerPhone.isBlank()) {
                group.customerPhone = s.customerPhone.trim();
            }
        }

        return new Grouping(signals, parent, groups);
    }

    private UUID idOf(Signal s) {
        return switch (s.kind()) {
            case BOOKING -> ((LabTestBooking) s.source()).getId();
            case ORDER -> ((Bill) s.source()).getId();
            case APPOINTMENT -> ((DoctorAppointment) s.source()).getId();
        };
    }

    private PatientSummaryResponse toResponse(PatientGroup group) {
        String id;
        String fullName;
        String phone;
        String email;

        if (group.email != null) {
            UserAuth user = userAuthRepository.findByEmail(group.email).orElse(null);
            id = user != null ? user.getId().toString() : group.email;
            fullName = (user != null && user.getFullName() != null && !user.getFullName().isBlank())
                    ? user.getFullName() : (group.customerName != null ? group.customerName : group.email);
            PatientProfile profile = user != null ? patientProfileRepository.findByUserId(user.getId()).orElse(null) : null;
            phone = profile != null && profile.getPhone() != null ? profile.getPhone() : group.customerPhone;
            // The directory shows the contact email the owner can edit, same as the patient's own
            // profile view — never the account's actual login email, which is never editable here.
            email = profile != null && profile.getContactEmail() != null && !profile.getContactEmail().isBlank()
                    ? profile.getContactEmail() : group.email;
        } else {
            id = "walkin-" + slug(group.customerName) + "-" + slug(group.customerPhone);
            fullName = group.customerName != null ? group.customerName : "Walk-in customer";
            phone = group.customerPhone;
            email = null;
        }

        return new PatientSummaryResponse(
                id,
                fullName,
                phone,
                email,
                group.bookingCount,
                group.orderCount,
                group.appointmentCount,
                group.lastActivity,
                "ACTIVE"
        );
    }

    /**
     * Links records that identify the same person: same email, or same
     * name + phone. A record supplying both an email and a name+phone acts
     * as a bridge, so two records that only share one signal each — one
     * matching by phone, the other by email — still end up in the same
     * group transitively.
     */
    private int[] unionByIdentity(List<Signal> signals) {
        int n = signals.size();
        int[] parent = new int[n];
        for (int i = 0; i < n; i++) {
            parent[i] = i;
        }

        Map<String, Integer> firstByEmail = new HashMap<>();
        Map<String, Integer> firstByNamePhone = new HashMap<>();

        for (int i = 0; i < n; i++) {
            Signal s = signals.get(i);
            String email = normalize(s.email);
            String name = normalize(s.customerName);
            String phone = normalizePhone(s.customerPhone);

            if (email != null) {
                Integer existing = firstByEmail.putIfAbsent(email, i);
                if (existing != null) {
                    union(parent, i, existing);
                }
            }
            if (name != null && phone != null) {
                String key = name + "|" + phone;
                Integer existing = firstByNamePhone.putIfAbsent(key, i);
                if (existing != null) {
                    union(parent, i, existing);
                }
            }
        }
        return parent;
    }

    private int find(int[] parent, int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    private void union(int[] parent, int a, int b) {
        int rootA = find(parent, a);
        int rootB = find(parent, b);
        if (rootA != rootB) {
            parent[rootA] = rootB;
        }
    }

    private String normalize(String s) {
        return (s == null || s.isBlank()) ? null : s.trim().toLowerCase();
    }

    private String normalizePhone(String s) {
        if (s == null) {
            return null;
        }
        String digits = s.replaceAll("[^0-9]", "");
        return digits.isBlank() ? null : digits;
    }

    private String slug(String s) {
        if (s == null || s.isBlank()) {
            return "unknown";
        }
        String slug = s.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+)|(-+$)", "");
        return slug.isBlank() ? "unknown" : slug;
    }

    private enum RecordKind { BOOKING, ORDER, APPOINTMENT }

    private record Signal(String email, String customerName, String customerPhone, LocalDate date, RecordKind kind, Object source) {
    }

    private record Grouping(List<Signal> signals, int[] parent, Map<Integer, PatientGroup> groups) {
    }

    private static final class PatientGroup {
        String email;
        String customerName;
        String customerPhone;
        long bookingCount;
        long orderCount;
        long appointmentCount;
        LocalDate lastActivity;
        final Set<UUID> recordIds = new HashSet<>();

        void touch(LocalDate date) {
            if (lastActivity == null || date.isAfter(lastActivity)) {
                lastActivity = date;
            }
        }
    }
}
