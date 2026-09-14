package com.company.medtech;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

// "test" profile (src/test/resources/application-test.yml) swaps real
// Postgres+Flyway for H2+Hibernate auto-DDL, so this doesn't need a real
// database available.
@SpringBootTest
@ActiveProfiles("test")
class MedtechApplicationTests {

	@Test
	void contextLoads() {
	}

}
