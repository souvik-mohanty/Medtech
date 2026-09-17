package com.company.medtech.lab.event;

/**
 * Published to Kafka right after a patient's own online booking is saved
 * (see LabTestBookingService#bookTest) — a plain, serializable snapshot of
 * exactly what a listener needs to notify both sides, not the JPA entity
 * itself. Kept intentionally separate from owner-entered walk-in bookings
 * (LabTestBookingService#createWalkInBooking), which still notify
 * synchronously — see NotificationService's class doc for why only this
 * one path is event-driven.
 */
public record BookingCreatedEvent(
        String bookingId,
        String franchiseId,
        String patientEmail,
        String patientDisplayName,
        String itemsSummary
) {
}
