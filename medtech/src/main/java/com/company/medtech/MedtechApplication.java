package com.company.medtech;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class MedtechApplication {

    public static void main(String[] args) {
        // Must happen before any JDBC connection is opened (Flyway included) —
        // on some JVM/OS combinations TimeZone.getDefault() resolves to a
        // legacy tz alias (e.g. "Asia/Calcutta" instead of "Asia/Kolkata")
        // that PostgreSQL's JDBC driver forwards at connection time and
        // Postgres's own tzdata rejects outright. Forcing UTC also avoids a
        // wider class of timezone-dependent bugs, so this stays even once
        // that specific driver/OS quirk stops mattering.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(MedtechApplication.class, args);
    }
}
