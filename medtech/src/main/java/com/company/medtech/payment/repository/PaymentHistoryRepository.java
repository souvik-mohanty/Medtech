package com.company.medtech.payment.repository;

import com.company.medtech.payment.model.PaymentHistory;
import com.company.medtech.payment.model.PaymentSourceType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, UUID> {

    List<PaymentHistory> findBySourceTypeAndSourceIdOrderByRecordedAtAsc(PaymentSourceType sourceType, UUID sourceId);
}
