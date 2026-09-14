package com.company.medtech.consultation.service;

import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.consultation.dto.DoctorScheduleRequest;
import com.company.medtech.consultation.dto.DoctorScheduleResponse;
import com.company.medtech.consultation.model.SlotType;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class DoctorScheduleServiceTest {

    @Autowired
    private DoctorScheduleService doctorScheduleService;

    @Autowired
    private FranchiseRepository franchiseRepository;

    private Franchise franchise;

    @BeforeEach
    void setUp() {
        franchise = franchiseRepository.save(newFranchise());
    }

    @Test
    void createsALimitedSchedule() {
        DoctorScheduleResponse response = doctorScheduleService.create(franchise.getOwnerEmail(), scheduleRequest(SlotType.LIMITED, 10));

        assertThat(response.getSlotType()).isEqualTo(SlotType.LIMITED);
        assertThat(response.getMaxPatients()).isEqualTo(10);
        assertThat(response.getBookedCount()).isZero();
    }

    @Test
    void createsARequestSchedule() {
        DoctorScheduleResponse response = doctorScheduleService.create(franchise.getOwnerEmail(), scheduleRequest(SlotType.REQUEST, null));

        assertThat(response.getSlotType()).isEqualTo(SlotType.REQUEST);
        assertThat(response.getMaxPatients()).isNull();
    }

    @Test
    void limitedScheduleWithoutMaxPatientsIsRejected() {
        DoctorScheduleRequest request = scheduleRequest(SlotType.LIMITED, null);

        assertThatThrownBy(() -> doctorScheduleService.create(franchise.getOwnerEmail(), request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("maximum patient count");
    }

    @Test
    void endTimeBeforeStartTimeIsRejected() {
        DoctorScheduleRequest request = scheduleRequest(SlotType.REQUEST, null);
        request.setStartTime(LocalTime.of(12, 0));
        request.setEndTime(LocalTime.of(10, 0));

        assertThatThrownBy(() -> doctorScheduleService.create(franchise.getOwnerEmail(), request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("End time");
    }

    @Test
    void patientOnlySeesUpcomingActiveSchedules() {
        doctorScheduleService.create(franchise.getOwnerEmail(), scheduleRequest(SlotType.LIMITED, 5));

        assertThat(doctorScheduleService.listForFranchise(franchise.getId().toString())).hasSize(1);
    }

    private DoctorScheduleRequest scheduleRequest(SlotType slotType, Integer maxPatients) {
        DoctorScheduleRequest request = new DoctorScheduleRequest();
        request.setDoctorName("Dr. Smith");
        request.setDoctorSpecialization("General Physician");
        request.setScheduleDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(12, 0));
        request.setSlotType(slotType);
        request.setMaxPatients(maxPatients);
        request.setFee(new BigDecimal("500.00"));
        return request;
    }

    private Franchise newFranchise() {
        Franchise f = new Franchise();
        f.setOwnerEmail("owner-" + UUID.randomUUID() + "@example.com");
        f.setName("Test Pharmacy");
        return f;
    }
}
