package com.company.medtech.lab.repository;

import com.company.medtech.lab.model.LabTestBookingItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LabTestBookingItemRepository extends JpaRepository<LabTestBookingItem, UUID> {

    List<LabTestBookingItem> findByBookingIdOrderByItemOrder(UUID bookingId);

    List<LabTestBookingItem> findByBookingIdInOrderByItemOrder(List<UUID> bookingIds);

    /** Blocks a LabTest delete once it has real booking history — see LabTestService#deleteTest. */
    boolean existsByLabTestId(UUID labTestId);

    /** Used when editing/deleting a walk-in booking — see LabTestBookingService#updateWalkInBooking/#deleteWalkInBooking. */
    void deleteByBookingId(UUID bookingId);
}
