package com.company.medtech.lab.repository;

import com.company.medtech.lab.model.LabTestBookingItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LabTestBookingItemRepository extends JpaRepository<LabTestBookingItem, UUID> {

    List<LabTestBookingItem> findByBookingIdOrderByItemOrder(UUID bookingId);

    List<LabTestBookingItem> findByBookingIdInOrderByItemOrder(List<UUID> bookingIds);
}
