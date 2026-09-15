package com.company.medtech.consultation.service;

import com.company.medtech.billing.model.PaymentMode;
import com.company.medtech.common.enums.OrderStatus;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.consultation.dto.DoctorAppointmentRequest;
import com.company.medtech.consultation.dto.DoctorAppointmentResponse;
import com.company.medtech.consultation.dto.DoctorScheduleRequest;
import com.company.medtech.consultation.dto.DoctorScheduleResponse;
import com.company.medtech.consultation.model.SlotType;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.model.PaymentGatewayConfig;
import com.company.medtech.franchise.model.PaymentProvider;
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
class DoctorAppointmentServiceTest {

    @Autowired
    private DoctorAppointmentService doctorAppointmentService;

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
    void limitedScheduleAssignsSequentialSerialNumbers() {
        DoctorScheduleResponse schedule = doctorScheduleService.create(franchise.getOwnerEmail(), scheduleRequest(SlotType.LIMITED, 2));

        DoctorAppointmentResponse first = doctorAppointmentService.bookAppointment("p1@example.com", bookingRequest(schedule.getId()));
        DoctorAppointmentResponse second = doctorAppointmentService.bookAppointment("p2@example.com", bookingRequest(schedule.getId()));

        assertThat(first.getSerialNumber()).isEqualTo(1);
        assertThat(second.getSerialNumber()).isEqualTo(2);
        assertThat(first.getStatus()).isEqualTo(OrderStatus.PAYMENT_PENDING);
    }

    @Test
    void limitedScheduleRejectsBookingOnceFull() {
        DoctorScheduleResponse schedule = doctorScheduleService.create(franchise.getOwnerEmail(), scheduleRequest(SlotType.LIMITED, 1));
        doctorAppointmentService.bookAppointment("p1@example.com", bookingRequest(schedule.getId()));

        DoctorAppointmentRequest secondRequest = bookingRequest(schedule.getId());
        assertThatThrownBy(() -> doctorAppointmentService.bookAppointment("p2@example.com", secondRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("fully booked");
    }

    @Test
    void requestScheduleGetsSerialNumbersButNoCap() {
        DoctorScheduleResponse schedule = doctorScheduleService.create(franchise.getOwnerEmail(), scheduleRequest(SlotType.REQUEST, null));

        DoctorAppointmentResponse first = doctorAppointmentService.bookAppointment("p1@example.com", bookingRequest(schedule.getId()));
        DoctorAppointmentResponse second = doctorAppointmentService.bookAppointment("p2@example.com", bookingRequest(schedule.getId()));

        assertThat(first.getSerialNumber()).isEqualTo(1);
        assertThat(second.getSerialNumber()).isEqualTo(2);
    }

    @Test
    void patientCannotBookTheSameScheduleTwice() {
        DoctorScheduleResponse schedule = doctorScheduleService.create(franchise.getOwnerEmail(), scheduleRequest(SlotType.REQUEST, null));
        doctorAppointmentService.bookAppointment("p1@example.com", bookingRequest(schedule.getId()));

        DoctorAppointmentRequest secondRequest = bookingRequest(schedule.getId());
        assertThatThrownBy(() -> doctorAppointmentService.bookAppointment("p1@example.com", secondRequest))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already have an appointment");
    }

    @Test
    void onlineBookingRejectedWithoutActiveGateway() {
        DoctorScheduleResponse schedule = doctorScheduleService.create(franchise.getOwnerEmail(), scheduleRequest(SlotType.REQUEST, null));
        DoctorAppointmentRequest request = bookingRequest(schedule.getId());
        request.setPaymentMode(PaymentMode.ONLINE);

        assertThatThrownBy(() -> doctorAppointmentService.bookAppointment("p1@example.com", request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("online payments");
    }

    @Test
    void onlineBookingAllowedWithActiveGateway() {
        PaymentGatewayConfig config = new PaymentGatewayConfig();
        config.setProvider(PaymentProvider.RAZORPAY);
        config.setApiKey("rzp_live_abc123");
        config.setEncryptedApiSecret("encrypted-blob");
        config.setActive(true);
        franchise.setPaymentGateway(config);
        franchiseRepository.save(franchise);

        DoctorScheduleResponse schedule = doctorScheduleService.create(franchise.getOwnerEmail(), scheduleRequest(SlotType.REQUEST, null));
        DoctorAppointmentRequest request = bookingRequest(schedule.getId());
        request.setPaymentMode(PaymentMode.ONLINE);

        DoctorAppointmentResponse response = doctorAppointmentService.bookAppointment("p1@example.com", request);

        assertThat(response.getPaymentMode()).isEqualTo(PaymentMode.ONLINE);
    }

    @Test
    void ownerCanMarkACashAppointmentPaid() {
        DoctorScheduleResponse schedule = doctorScheduleService.create(franchise.getOwnerEmail(), scheduleRequest(SlotType.REQUEST, null));
        DoctorAppointmentResponse booked = doctorAppointmentService.bookAppointment("p1@example.com", bookingRequest(schedule.getId()));

        DoctorAppointmentResponse paid = doctorAppointmentService.markPaid(franchise.getOwnerEmail(), booked.getId());

        assertThat(paid.getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(paid.getPaidAt()).isNotNull();
    }

    @Test
    void ownerSeesTheirFranchisesAppointmentsWithScheduleDetails() {
        DoctorScheduleResponse schedule = doctorScheduleService.create(franchise.getOwnerEmail(), scheduleRequest(SlotType.LIMITED, 3));
        doctorAppointmentService.bookAppointment("p1@example.com", bookingRequest(schedule.getId()));

        assertThat(doctorAppointmentService.listForOwner(franchise.getOwnerEmail()))
                .hasSize(1)
                .first()
                .satisfies(a -> assertThat(a.getDoctorName()).isEqualTo("Dr. Smith"));
    }

    private DoctorAppointmentRequest bookingRequest(String scheduleId) {
        DoctorAppointmentRequest request = new DoctorAppointmentRequest();
        request.setScheduleId(scheduleId);
        request.setPatientName("Test Patient");
        request.setPatientAge(30);
        request.setMobileNumber("9999999999");
        request.setPaymentMode(PaymentMode.CASH);
        return request;
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
