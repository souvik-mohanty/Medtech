package com.company.medtech.notification.listener;

import com.company.medtech.config.KafkaTopicConfig;
import com.company.medtech.lab.event.BookingCreatedEvent;
import com.company.medtech.notification.model.NotificationType;
import com.company.medtech.notification.service.NotificationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.UUID;

/**
 * Reacts to a patient's own online booking (see
 * LabTestBookingService#bookTest -> BookingEventProducer) by creating both
 * sides' notifications — the one place in the app where a notification is
 * triggered by consuming an event rather than a direct method call. Runs
 * on Kafka's own consumer thread, decoupled from the HTTP request that
 * created the booking: the patient's booking response returns immediately
 * without waiting on this.
 */
@Component
public class BookingEventListener {

    private final NotificationService notificationService;

    public BookingEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = KafkaTopicConfig.BOOKING_EVENTS_TOPIC, groupId = "medtech-notifications")
    public void onBookingCreated(BookingCreatedEvent event) {
        notificationService.notifyPatient(event.patientEmail(), NotificationType.BOOKING_CONFIRMATION,
                "Booking confirmed", "Your booking for " + event.itemsSummary() + " has been confirmed.");

        if (StringUtils.hasText(event.franchiseId())) {
            notificationService.notifyFranchise(UUID.fromString(event.franchiseId()), NotificationType.BOOKING_CONFIRMATION,
                    "New booking", event.patientDisplayName() + " booked " + event.itemsSummary() + ".");
        }
    }
}
