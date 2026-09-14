package com.company.medtech.payment.service;

import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.payment.dto.PaymentResponse;
import com.company.medtech.payment.model.Payment;
import com.company.medtech.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final FranchiseService franchiseService;

    public PaymentService(PaymentRepository paymentRepository, FranchiseService franchiseService) {
        this.paymentRepository = paymentRepository;
        this.franchiseService = franchiseService;
    }

    public java.util.List<PaymentResponse> listForOwner(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return paymentRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public java.util.List<PaymentResponse> listForPatient(String patientEmail) {
        return paymentRepository.findByPatientEmailOrderByCreatedAtDesc(patientEmail)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private PaymentResponse toResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId().toString(),
                payment.getBookingId().toString(),
                payment.getPatientName(),
                payment.getAmount(),
                payment.getAmountPaid(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getRefundStatus(),
                payment.getCreatedAt()
        );
    }
}
