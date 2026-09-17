package com.company.medtech.lab.service;

import com.company.medtech.config.KafkaTopicConfig;
import com.company.medtech.lab.event.BookingCreatedEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Publishes booking events to Kafka. KafkaTemplate#send is fire-and-forget
 * (returns a CompletableFuture nobody blocks on here) — a slow or
 * temporarily unreachable broker never delays the patient's booking
 * response, it just means the notification arrives late. A production
 * system that can't tolerate a dropped event on a downed broker would add
 * a .whenComplete callback here to log/retry/alert; this app just accepts
 * best-effort delivery, matching the low stakes of "a notification was a
 * little late."
 */
@Service
public class BookingEventProducer {

    private final KafkaTemplate<String, BookingCreatedEvent> kafkaTemplate;

    public BookingEventProducer(KafkaTemplate<String, BookingCreatedEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /** Keyed by bookingId so, if this topic ever gets more partitions, every event for one booking still lands in order. */
    public void publishBookingCreated(BookingCreatedEvent event) {
        kafkaTemplate.send(KafkaTopicConfig.BOOKING_EVENTS_TOPIC, event.bookingId(), event);
    }
}
