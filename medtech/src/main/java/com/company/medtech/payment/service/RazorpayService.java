package com.company.medtech.payment.service;

import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.security.CredentialEncryptionService;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.model.PaymentGatewayConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;

/**
 * Talks to Razorpay's REST API directly (no SDK dependency needed — order
 * creation and signature verification are both simple enough as-is) using
 * each franchise's own key/secret, decrypted from PaymentGatewayConfig.
 * There is no platform-wide Razorpay account: every order is created
 * against the franchise's own, so money flows straight to their account,
 * never through this app.
 */
@Service
public class RazorpayService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayService.class);
    private static final String API_BASE = "https://api.razorpay.com/v1";

    private final CredentialEncryptionService encryptionService;
    private final RestClient restClient;

    public RazorpayService(CredentialEncryptionService encryptionService) {
        this.encryptionService = encryptionService;
        this.restClient = RestClient.create(API_BASE);
    }

    public record RazorpayOrder(String orderId, String keyId, long amountPaise) {
    }

    /**
     * Creates a Razorpay Order for the given rupee amount — this is what
     * Checkout.js needs to open against. `receipt` is just Razorpay's own
     * label for the order in their dashboard; we use our booking/order id
     * so it's traceable from either side.
     */
    public RazorpayOrder createOrder(Franchise franchise, BigDecimal amount, String receipt) {
        PaymentGatewayConfig gateway = requireActiveGateway(franchise);
        String keySecret = encryptionService.decrypt(gateway.getEncryptedApiSecret());
        long amountPaise = amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("/orders")
                    .headers(h -> h.setBasicAuth(gateway.getApiKey(), keySecret))
                    .body(Map.of(
                            "amount", amountPaise,
                            "currency", "INR",
                            "receipt", receipt
                    ))
                    .retrieve()
                    .body(Map.class);

            String orderId = response != null ? (String) response.get("id") : null;
            if (orderId == null) {
                throw new BusinessException("Razorpay didn't return an order id — please try again.");
            }
            return new RazorpayOrder(orderId, gateway.getApiKey(), amountPaise);
        } catch (RestClientResponseException e) {
            log.warn("Razorpay order creation failed for franchise {}: {} {}", franchise.getId(), e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException(razorpayErrorMessage(e));
        }
    }

    /**
     * Razorpay's documented check-out signature scheme:
     * HMAC-SHA256(order_id + "|" + payment_id, key_secret), hex-encoded,
     * must equal what Checkout.js's success handler reported. This is what
     * actually proves the payment is real and matches this exact order —
     * never trust the frontend's mere claim that payment succeeded.
     */
    public boolean verifySignature(Franchise franchise, String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null) {
            return false;
        }
        PaymentGatewayConfig gateway = requireActiveGateway(franchise);
        String keySecret = encryptionService.decrypt(gateway.getEncryptedApiSecret());

        String payload = razorpayOrderId + "|" + razorpayPaymentId;
        String expected = hmacSha256Hex(payload, keySecret);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                razorpaySignature.getBytes(StandardCharsets.UTF_8)
        );
    }

    private PaymentGatewayConfig requireActiveGateway(Franchise franchise) {
        if (!franchise.hasActivePaymentGateway()) {
            throw new BusinessException("This lab hasn't set up online payments yet. Choose cash payment instead.");
        }
        return franchise.getPaymentGateway();
    }

    private String hmacSha256Hex(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute Razorpay signature", e);
        }
    }

    private String razorpayErrorMessage(RestClientResponseException e) {
        if (e.getStatusCode() == HttpStatusCode.valueOf(401)) {
            return "This lab's Razorpay key doesn't seem to be valid — ask them to check it in Settings.";
        }
        return "Couldn't reach Razorpay right now — please try again in a moment or pay at the lab instead.";
    }
}
