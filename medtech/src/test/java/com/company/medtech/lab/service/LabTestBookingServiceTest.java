package com.company.medtech.lab.service;

import com.company.medtech.billing.model.PaymentMode;
import com.company.medtech.common.enums.OrderStatus;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.model.PaymentGatewayConfig;
import com.company.medtech.franchise.model.PaymentProvider;
import com.company.medtech.franchise.repository.FranchiseRepository;
import com.company.medtech.lab.dto.LabTestBookingRequest;
import com.company.medtech.lab.dto.LabTestBookingResponse;
import com.company.medtech.lab.dto.LabTestRequest;
import com.company.medtech.lab.dto.LabTestResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class LabTestBookingServiceTest {

    @Autowired
    private LabTestBookingService labTestBookingService;

    @Autowired
    private LabTestService labTestService;

    @Autowired
    private FranchiseRepository franchiseRepository;

    private Franchise franchise;
    private LabTestResponse test;

    @BeforeEach
    void setUp() {
        franchise = franchiseRepository.save(newFranchise());
        test = labTestService.createTest(franchise.getOwnerEmail(), testRequest("CBC", "300.00"));
    }

    @Test
    void cashBookingStartsPaymentPending() {
        LabTestBookingResponse response = labTestBookingService.bookTest("patient@example.com", bookingRequest(test.getId(), null, PaymentMode.CASH));

        assertThat(response.getStatus()).isEqualTo(OrderStatus.PAYMENT_PENDING);
        assertThat(response.getPaymentMode()).isEqualTo(PaymentMode.CASH);
        assertThat(response.getItemName()).isEqualTo("CBC");
        assertThat(response.getAddress()).isEqualTo("221B Baker Street");
        assertThat(response.getMobileNumber()).isEqualTo("9999999999");
    }

    @Test
    void onlineBookingRejectedWithoutActiveGateway() {
        assertThatThrownBy(() ->
                labTestBookingService.bookTest("patient@example.com", bookingRequest(test.getId(), null, PaymentMode.ONLINE)))
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

        LabTestBookingResponse response = labTestBookingService.bookTest("patient@example.com", bookingRequest(test.getId(), null, PaymentMode.ONLINE));

        assertThat(response.getPaymentMode()).isEqualTo(PaymentMode.ONLINE);
    }

    @Test
    void rejectsBookingBothATestAndACombo() {
        LabTestBookingRequest request = bookingRequest(test.getId(), UUID.randomUUID().toString(), PaymentMode.CASH);

        assertThatThrownBy(() -> labTestBookingService.bookTest("patient@example.com", request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("exactly one");
    }

    @Test
    void rejectsBookingNeitherATestNorACombo() {
        LabTestBookingRequest request = bookingRequest(null, null, PaymentMode.CASH);

        assertThatThrownBy(() -> labTestBookingService.bookTest("patient@example.com", request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("exactly one");
    }

    @Test
    void ownerCanMarkACashBookingPaid() {
        LabTestBookingResponse booked = labTestBookingService.bookTest("patient@example.com", bookingRequest(test.getId(), null, PaymentMode.CASH));

        LabTestBookingResponse paid = labTestBookingService.markPaid(franchise.getOwnerEmail(), booked.getId());

        assertThat(paid.getStatus()).isEqualTo(OrderStatus.PAID);
        assertThat(paid.getPaidAt()).isNotNull();
    }

    @Test
    void ownerSeesTheirFranchisesBookings() {
        labTestBookingService.bookTest("patient@example.com", bookingRequest(test.getId(), null, PaymentMode.CASH));

        assertThat(labTestBookingService.listForOwner(franchise.getOwnerEmail())).hasSize(1);
    }

    private LabTestBookingRequest bookingRequest(String testId, String comboId, PaymentMode paymentMode) {
        LabTestBookingRequest request = new LabTestBookingRequest();
        request.setFranchiseId(franchise.getId().toString());
        request.setLabTestId(testId);
        request.setComboId(comboId);
        request.setAddress("221B Baker Street");
        request.setMobileNumber("9999999999");
        request.setPaymentMode(paymentMode);
        return request;
    }

    private LabTestRequest testRequest(String name, String price) {
        LabTestRequest request = new LabTestRequest();
        request.setName(name);
        request.setPrice(new java.math.BigDecimal(price));
        return request;
    }

    private Franchise newFranchise() {
        Franchise f = new Franchise();
        f.setOwnerEmail("owner-" + UUID.randomUUID() + "@example.com");
        f.setName("Test Pharmacy");
        return f;
    }
}
