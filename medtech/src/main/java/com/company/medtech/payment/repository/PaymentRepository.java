package com.company.medtech.payment.repository;

import com.company.medtech.payment.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByBookingId(UUID bookingId);

    List<Payment> findByFranchiseIdOrderByCreatedAtDesc(UUID franchiseId);

    List<Payment> findByPatientEmailOrderByCreatedAtDesc(String patientEmail);
}
