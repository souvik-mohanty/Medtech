package com.company.medtech.lab.service;

import com.company.medtech.config.KafkaTopicConfig;
import com.company.medtech.lab.event.BookingCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Publishes booking events to Kafka. KafkaTemplate#send LOOKS
 * fire-and-forget (it returns a CompletableFuture), but that's only true
 * once the producer already has cached metadata for this topic — the
 * *first* send to a topic the producer hasn't seen yet blocks the calling
 * thread synchronously while it fetches that metadata, and throws
 * synchronously (not just failing the returned future) if the broker never
 * responds within `spring.kafka.producer.properties.max.block.ms`. With no
 * Kafka broker deployed anywhere in production yet, that isn't a
 * hypothetical: it's exactly what was silently turning every online
 * booking into a 60-second hang followed by a 500, since bookTest() always
 * calls this regardless of payment method. The try/catch below plus a
 * short max.block.ms (see application.yml) is what actually makes this
 * fire-and-forget: a missing broker now costs a couple of seconds and a
 * log line, never the patient's booking response.
 */
@Service
public class BookingEventProducer {

    private static final Logger log = LoggerFactory.getLogger(BookingEventProducer.class);

    private final KafkaTemplate<String, BookingCreatedEvent> kafkaTemplate;

    public BookingEventProducer(KafkaTemplate<String, BookingCreatedEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /** Keyed by bookingId so, if this topic ever gets more partitions, every event for one booking still lands in order. */
    public void publishBookingCreated(BookingCreatedEvent event) {
        try {
            kafkaTemplate.send(KafkaTopicConfig.BOOKING_EVENTS_TOPIC, event.bookingId(), event);
        } catch (Exception e) {
            log.warn("Couldn't publish BookingCreatedEvent for booking {} — the booking itself still succeeded, "
                    + "its confirmation notification just won't arrive. Cause: {}", event.bookingId(), e.toString());
        }
    }
}
