package com.company.medtech.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Declares topics explicitly rather than relying on Kafka's
 * auto-create-on-first-use behavior — this way a typo in a topic name
 * fails loudly at startup (topic never gets created, listener never
 * receives anything) instead of silently creating a stray new topic.
 */
@Configuration
public class KafkaTopicConfig {

    public static final String BOOKING_EVENTS_TOPIC = "booking-events";

    @Bean
    public NewTopic bookingEventsTopic() {
        return TopicBuilder.name(BOOKING_EVENTS_TOPIC)
                .partitions(1)
                .replicas(1)
                .build();
    }
}
