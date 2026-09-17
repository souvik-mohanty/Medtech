package com.company.medtech.lab.service;

import com.company.medtech.auth.model.UserAuth;
import com.company.medtech.auth.repository.UserAuthRepository;
import com.company.medtech.common.constants.AppConstants;
import com.company.medtech.common.enums.PaymentStatus;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.coupon.dto.CouponRequest;
import com.company.medtech.coupon.service.CouponService;
import com.company.medtech.billing.model.DiscountType;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.model.PaymentGatewayConfig;
import com.company.medtech.franchise.model.PaymentProvider;
import com.company.medtech.franchise.repository.FranchiseRepository;
import com.company.medtech.lab.dto.LabTestBookingRequest;
import com.company.medtech.lab.dto.LabTestBookingResponse;
import com.company.medtech.lab.dto.LabTestRequest;
import com.company.medtech.lab.dto.LabTestResponse;
import com.company.medtech.lab.model.BookingStatus;
import com.company.medtech.lab.model.CollectionMethod;
import com.company.medtech.lab.model.CollectionStatus;
import com.company.medtech.lab.model.TestCategory;
import com.company.medtech.notification.model.Notification;
import com.company.medtech.notification.repository.NotificationRepository;
import com.company.medtech.patient.model.PatientAddress;
import com.company.medtech.patient.model.PatientProfile;
import com.company.medtech.patient.repository.PatientAddressRepository;
import com.company.medtech.patient.repository.PatientProfileRepository;
import com.company.medtech.payment.model.PaymentMethod;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
// Only this test class needs a real Kafka round-trip (see
// bookingPublishesAKafkaEventThatCreatesBothNotifications below) — every
// other @SpringBootTest class leaves the listener container off (see
// application-test.yml) since it has no embedded broker to connect to.
@EmbeddedKafka(partitions = 1, topics = "booking-events", bootstrapServersProperty = "spring.kafka.bootstrap-servers")
@TestPropertySource(properties = "spring.kafka.listener.auto-startup=true")
class LabTestBookingServiceTest {

    @Autowired
    private LabTestBookingService labTestBookingService;

    @Autowired
    private LabTestService labTestService;

    @Autowired
    private FranchiseRepository franchiseRepository;

    @Autowired
    private UserAuthRepository userAuthRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private PatientAddressRepository patientAddressRepository;

    @Autowired
    private CouponService couponService;

    @Autowired
    private NotificationRepository notificationRepository;

    private Franchise franchise;
    private LabTestResponse test;
    private PatientProfile patientProfile;
    private String patientEmail;

    @BeforeEach
    void setUp() {
        franchise = franchiseRepository.save(newFranchise());
        test = labTestService.createTest(franchise.getOwnerEmail(), testRequest("CBC", "300.00"));

        patientEmail = "patient-" + UUID.randomUUID() + "@example.com";
        UserAuth patientUser = new UserAuth();
        patientUser.setEmail(patientEmail);
        patientUser.setRole(AppConstants.ROLE_PATIENT);
        patientUser.setActive(true);
        patientUser.setFullName("Test Patient");
        patientUser = userAuthRepository.save(patientUser);

        PatientProfile profile = new PatientProfile();
        profile.setUserId(patientUser.getId());
        profile.setPhone("9876543210");
        patientProfile = patientProfileRepository.save(profile);
    }

    @Test
    void bookingAppliesARealCouponToTheTotal() {
        CouponRequest couponRequest = new CouponRequest();
        couponRequest.setCode("LAB50");
        couponRequest.setType(DiscountType.FLAT);
        couponRequest.setValue(new BigDecimal("50.00"));
        couponRequest.setExpiresAt(LocalDateTime.now().plusDays(30));
        couponService.create(franchise.getOwnerEmail(), couponRequest);

        LabTestBookingRequest request = bookingRequest(List.of(test.getId()), null, PaymentMethod.CASH);
        request.setCouponCode("lab50");

        LabTestBookingResponse response = labTestBookingService.bookTest(patientEmail, request);

        assertThat(response.getDiscount()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(response.getCouponCode()).isEqualTo("LAB50");
        // subtotal 300 - discount 50 = 250 taxable, +5% GST = 262.50
        assertThat(response.getTotalAmount()).isEqualByComparingTo(new BigDecimal("262.50"));
    }

    @Test
    void bookingRejectsAnUnknownCouponCode() {
        LabTestBookingRequest request = bookingRequest(List.of(test.getId()), null, PaymentMethod.CASH);
        request.setCouponCode("NOPE");

        assertThatThrownBy(() -> labTestBookingService.bookTest(patientEmail, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("doesn't exist");
    }

    @Test
    void cashBookingStartsPaymentPending() {
        LabTestBookingResponse response = labTestBookingService.bookTest(patientEmail, bookingRequest(List.of(test.getId()), null, PaymentMethod.CASH));

        assertThat(response.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(response.getStatus()).isEqualTo(BookingStatus.SAMPLE_COLLECTION_SCHEDULED);
        assertThat(response.getCollectionStatus()).isEqualTo(CollectionStatus.SCHEDULED);
        assertThat(response.getItems()).hasSize(1);
        assertThat(response.getItems().get(0).getTestName()).isEqualTo("CBC");
        assertThat(response.getTotalAmount()).isNotNull();
    }

    /**
     * Proves the Kafka round-trip actually works end to end, not just that the producer call
     * doesn't throw: bookTest() only publishes an event (see BookingEventProducer); a separate
     * consumer thread (BookingEventListener, backed by the @EmbeddedKafka broker this test class
     * starts) is what actually writes the notification rows, asynchronously and out of process
     * from this test method — hence the poll-with-timeout instead of asserting immediately.
     */
    @Test
    void bookingPublishesAKafkaEventThatCreatesBothNotifications() throws InterruptedException {
        labTestBookingService.bookTest(patientEmail, bookingRequest(List.of(test.getId()), null, PaymentMethod.CASH));

        List<Notification> patientNotifications = awaitNotifications(() -> notificationRepository.findByPatientEmailOrderByCreatedAtDesc(patientEmail));
        assertThat(patientNotifications).isNotEmpty();
        assertThat(patientNotifications.get(0).getMessage()).contains("CBC");

        List<Notification> franchiseNotifications = awaitNotifications(() -> notificationRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId()));
        assertThat(franchiseNotifications).isNotEmpty();
    }

    private List<Notification> awaitNotifications(java.util.function.Supplier<List<Notification>> query) throws InterruptedException {
        Duration timeout = Duration.ofSeconds(10);
        long deadline = System.currentTimeMillis() + timeout.toMillis();
        while (System.currentTimeMillis() < deadline) {
            List<Notification> found = query.get();
            if (!found.isEmpty()) {
                return found;
            }
            Thread.sleep(100);
        }
        return query.get();
    }

    @Test
    void onlineBookingRejectedWithoutActiveGateway() {
        assertThatThrownBy(() ->
                labTestBookingService.bookTest(patientEmail, bookingRequest(List.of(test.getId()), null, PaymentMethod.UPI)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("online payments");
    }

    @Test
    void onlineBookingSucceedsInstantlyWithActiveGateway() {
        PaymentGatewayConfig config = new PaymentGatewayConfig();
        config.setProvider(PaymentProvider.RAZORPAY);
        config.setApiKey("rzp_live_abc123");
        config.setEncryptedApiSecret("encrypted-blob");
        config.setActive(true);
        franchise.setPaymentGateway(config);
        franchiseRepository.save(franchise);

        LabTestBookingResponse response = labTestBookingService.bookTest(patientEmail, bookingRequest(List.of(test.getId()), null, PaymentMethod.UPI));

        assertThat(response.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
    }

    @Test
    void rejectsBookingBothTestsAndAPackage() {
        LabTestBookingRequest request = bookingRequest(List.of(test.getId()), UUID.randomUUID().toString(), PaymentMethod.CASH);

        assertThatThrownBy(() -> labTestBookingService.bookTest(patientEmail, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("either");
    }

    @Test
    void rejectsBookingNeitherTestsNorAPackage() {
        LabTestBookingRequest request = bookingRequest(null, null, PaymentMethod.CASH);

        assertThatThrownBy(() -> labTestBookingService.bookTest(patientEmail, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("either");
    }

    @Test
    void homeCollectionRequiresAnAddress() {
        LabTestBookingRequest request = bookingRequest(List.of(test.getId()), null, PaymentMethod.CASH);
        request.setCollectionMethod(CollectionMethod.HOME_COLLECTION);
        request.setAddressId(null);

        assertThatThrownBy(() -> labTestBookingService.bookTest(patientEmail, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("address");
    }

    @Test
    void homeCollectionAddsTheCollectionChargeAndResolvesTheAddress() {
        PatientAddress address = new PatientAddress();
        address.setPatientProfileId(patientProfile.getId());
        address.setLabel("Home");
        address.setLine1("221B Baker Street");
        address.setCity("Bhubaneswar");
        address.setState("Odisha");
        address.setPincode("751001");
        address = patientAddressRepository.save(address);

        LabTestBookingRequest request = bookingRequest(List.of(test.getId()), null, PaymentMethod.CASH);
        request.setCollectionMethod(CollectionMethod.HOME_COLLECTION);
        request.setAddressId(address.getId().toString());

        LabTestBookingResponse response = labTestBookingService.bookTest(patientEmail, request);

        assertThat(response.getAddressLabel()).isEqualTo("Home");
        assertThat(response.getCollectionCharge()).isEqualByComparingTo("99");
        assertThat(response.getTotalAmount()).isGreaterThan(response.getSubtotal());
    }

    @Test
    void ownerCanMarkACashBookingPaid() {
        LabTestBookingResponse booked = labTestBookingService.bookTest(patientEmail, bookingRequest(List.of(test.getId()), null, PaymentMethod.CASH));

        LabTestBookingResponse paid = labTestBookingService.markPaid(franchise.getOwnerEmail(), booked.getId());

        assertThat(paid.getPaymentStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(paid.getPaidAt()).isNotNull();
    }

    @Test
    void ownerCanAdvanceCollectionStatus() {
        LabTestBookingResponse booked = labTestBookingService.bookTest(patientEmail, bookingRequest(List.of(test.getId()), null, PaymentMethod.CASH));

        LabTestBookingResponse updated = labTestBookingService.updateCollectionStatus(franchise.getOwnerEmail(), booked.getId(), CollectionStatus.COMPLETED);

        assertThat(updated.getCollectionStatus()).isEqualTo(CollectionStatus.COMPLETED);
        assertThat(updated.getStatus()).isEqualTo(BookingStatus.REPORT_READY);
    }

    @Test
    void ownerSeesTheirFranchisesBookings() {
        labTestBookingService.bookTest(patientEmail, bookingRequest(List.of(test.getId()), null, PaymentMethod.CASH));

        assertThat(labTestBookingService.listForOwner(franchise.getOwnerEmail())).hasSize(1);
    }

    @Test
    void patientSeesTheirOwnBookings() {
        labTestBookingService.bookTest(patientEmail, bookingRequest(List.of(test.getId()), null, PaymentMethod.CASH));

        assertThat(labTestBookingService.listForPatient(patientEmail)).hasSize(1);
    }

    private LabTestBookingRequest bookingRequest(List<String> testIds, String packageId, PaymentMethod paymentMethod) {
        LabTestBookingRequest request = new LabTestBookingRequest();
        request.setFranchiseId(franchise.getId().toString());
        request.setTestIds(testIds);
        request.setPackageId(packageId);
        request.setCollectionMethod(CollectionMethod.LAB_VISIT);
        request.setCollectionDate(java.time.LocalDate.now().plusDays(1));
        request.setCollectionSlot("08:00 AM – 10:00 AM");
        request.setPaymentMethod(paymentMethod);
        return request;
    }

    private LabTestRequest testRequest(String name, String price) {
        LabTestRequest request = new LabTestRequest();
        request.setName(name);
        request.setPrice(new java.math.BigDecimal(price));
        request.setCategory(TestCategory.BLOOD);
        request.setReportTurnaroundHours(24);
        // Explicit per-test GST — no more implicit flat-rate GST on every booking regardless of test config.
        request.setGstPercentage(new java.math.BigDecimal("5"));
        return request;
    }

    private Franchise newFranchise() {
        Franchise f = new Franchise();
        f.setOwnerEmail("owner-" + UUID.randomUUID() + "@example.com");
        f.setName("Test Pharmacy");
        return f;
    }
}
