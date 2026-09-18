package com.company.medtech.lab.service;

import com.company.medtech.auth.model.UserAuth;
import com.company.medtech.auth.repository.UserAuthRepository;
import com.company.medtech.billing.service.InvoicePdfService;
import com.company.medtech.common.enums.PaymentStatus;
import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.coupon.service.CouponService;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.repository.FranchiseRepository;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.lab.dto.LabTestBookingItemResponse;
import com.company.medtech.lab.dto.LabTestBookingRequest;
import com.company.medtech.lab.dto.LabTestBookingResponse;
import com.company.medtech.lab.dto.WalkInBookingRequest;
import com.company.medtech.lab.event.BookingCreatedEvent;
import com.company.medtech.lab.model.BookingSource;
import com.company.medtech.lab.model.BookingStatus;
import com.company.medtech.lab.model.CollectionMethod;
import com.company.medtech.lab.model.CollectionStatus;
import com.company.medtech.lab.model.LabReport;
import com.company.medtech.lab.model.LabTest;
import com.company.medtech.lab.model.LabTestBooking;
import com.company.medtech.lab.model.LabTestBookingItem;
import com.company.medtech.lab.model.LabTestCombo;
import com.company.medtech.lab.repository.LabReportRepository;
import com.company.medtech.lab.repository.LabTestBookingItemRepository;
import com.company.medtech.lab.repository.LabTestBookingRepository;
import com.company.medtech.lab.repository.LabTestComboRepository;
import com.company.medtech.lab.repository.LabTestRepository;
import com.company.medtech.notification.model.NotificationType;
import com.company.medtech.notification.service.NotificationService;
import com.company.medtech.patient.model.PatientAddress;
import com.company.medtech.patient.model.PatientProfile;
import com.company.medtech.patient.repository.FamilyMemberRepository;
import com.company.medtech.patient.repository.PatientAddressRepository;
import com.company.medtech.patient.repository.PatientProfileRepository;
import com.company.medtech.patient.service.PatientProfileService;
import com.company.medtech.payment.dto.PaymentHistoryEntryResponse;
import com.company.medtech.payment.model.Payment;
import com.company.medtech.payment.model.PaymentHistory;
import com.company.medtech.payment.model.PaymentMethod;
import com.company.medtech.payment.model.PaymentSourceType;
import com.company.medtech.payment.model.RefundStatus;
import com.company.medtech.payment.repository.PaymentHistoryRepository;
import com.company.medtech.payment.repository.PaymentRepository;
import com.company.medtech.payment.service.RazorpayService;
import com.company.medtech.referral.model.CommissionType;
import com.company.medtech.referral.model.Referral;
import com.company.medtech.referral.repository.ReferralRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LabTestBookingService {

    /** Mirrors the frontend's own collection-status -> booking-status derivation table. */
    private static final Map<CollectionStatus, BookingStatus> BOOKING_STATUS_FOR_COLLECTION = Map.of(
            CollectionStatus.SCHEDULED, BookingStatus.SAMPLE_COLLECTION_SCHEDULED,
            CollectionStatus.ASSIGNED, BookingStatus.SAMPLE_COLLECTION_SCHEDULED,
            CollectionStatus.SAMPLE_COLLECTED, BookingStatus.SAMPLE_COLLECTED,
            CollectionStatus.PROCESSING, BookingStatus.PROCESSING,
            CollectionStatus.COMPLETED, BookingStatus.REPORT_READY
    );

    private final LabTestBookingRepository bookingRepository;
    private final LabTestBookingItemRepository bookingItemRepository;
    private final LabTestRepository labTestRepository;
    private final LabTestComboRepository labTestComboRepository;
    private final FranchiseRepository franchiseRepository;
    private final FranchiseService franchiseService;
    private final UserAuthRepository userAuthRepository;
    private final PatientProfileService patientProfileService;
    private final PatientAddressRepository patientAddressRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final PaymentRepository paymentRepository;
    private final ReferralRepository referralRepository;
    private final LabReportRepository labReportRepository;
    private final NotificationService notificationService;
    private final PatientProfileRepository patientProfileRepository;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final InvoicePdfService invoicePdfService;
    private final CouponService couponService;
    private final BookingEventProducer bookingEventProducer;
    private final RazorpayService razorpayService;

    public LabTestBookingService(
            LabTestBookingRepository bookingRepository,
            LabTestBookingItemRepository bookingItemRepository,
            LabTestRepository labTestRepository,
            LabTestComboRepository labTestComboRepository,
            FranchiseRepository franchiseRepository,
            FranchiseService franchiseService,
            UserAuthRepository userAuthRepository,
            PatientProfileService patientProfileService,
            PatientAddressRepository patientAddressRepository,
            FamilyMemberRepository familyMemberRepository,
            PaymentRepository paymentRepository,
            ReferralRepository referralRepository,
            LabReportRepository labReportRepository,
            NotificationService notificationService,
            PatientProfileRepository patientProfileRepository,
            PaymentHistoryRepository paymentHistoryRepository,
            InvoicePdfService invoicePdfService,
            CouponService couponService,
            BookingEventProducer bookingEventProducer,
            RazorpayService razorpayService
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingItemRepository = bookingItemRepository;
        this.labTestRepository = labTestRepository;
        this.labTestComboRepository = labTestComboRepository;
        this.franchiseRepository = franchiseRepository;
        this.franchiseService = franchiseService;
        this.userAuthRepository = userAuthRepository;
        this.patientProfileService = patientProfileService;
        this.couponService = couponService;
        this.patientAddressRepository = patientAddressRepository;
        this.familyMemberRepository = familyMemberRepository;
        this.paymentRepository = paymentRepository;
        this.referralRepository = referralRepository;
        this.labReportRepository = labReportRepository;
        this.notificationService = notificationService;
        this.patientProfileRepository = patientProfileRepository;
        this.paymentHistoryRepository = paymentHistoryRepository;
        this.invoicePdfService = invoicePdfService;
        this.bookingEventProducer = bookingEventProducer;
        this.razorpayService = razorpayService;
    }

    /**
     * A patient booking either a set of individual tests or a package
     * (exactly one of testIds/packageId). Money math (subtotal/GST/
     * collection charge/total) is computed here, never trusted from the
     * client. CASH payments start PENDING until the owner confirms them via
     * #markPaid; every other method is mock-marked SUCCESS immediately,
     * since no real payment gateway is wired up anywhere in this codebase —
     * same rule as billing/'s online orders, just resolved instantly here
     * rather than left PENDING, per this app's own UX decision.
     */
    @Transactional
    public LabTestBookingResponse bookTest(String patientEmail, LabTestBookingRequest request) {
        boolean hasTests = request.getTestIds() != null && !request.getTestIds().isEmpty();
        boolean hasPackage = request.getPackageId() != null && !request.getPackageId().isBlank();
        if (hasTests == hasPackage) {
            throw new BusinessException("Book either individual tests or a package, not both");
        }
        if (request.getCollectionMethod() == CollectionMethod.HOME_COLLECTION) {
            if (request.getAddressId() == null || request.getAddressId().isBlank()) {
                throw new BusinessException("An address is required for home collection");
            }
            if (request.getCollectionSlot() == null || request.getCollectionSlot().isBlank()) {
                throw new BusinessException("A collection time slot is required for home collection");
            }
        }

        UUID franchiseId = parseId(request.getFranchiseId(), "Franchise");
        Franchise franchise = franchiseRepository.findById(franchiseId)
                .orElseThrow(() -> new ResourceNotFoundException("Franchise", "id", request.getFranchiseId()));
        if (!franchise.isActive()) {
            throw new BusinessException("This lab is currently unavailable.");
        }
        if (request.getPaymentMethod() != PaymentMethod.CASH && !franchise.hasActivePaymentGateway()) {
            throw new BusinessException("This lab hasn't set up online payments yet. Choose cash payment instead.");
        }

        UserAuth patient = userAuthRepository.findByEmail(patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", patientEmail));
        PatientProfile profile = patientProfileService.getOrCreateProfile(patient.getId());
        if (profile.getPhone() == null || profile.getPhone().isBlank()) {
            throw new BusinessException("Add your phone number before booking");
        }

        ResolvedItems resolved = resolveItems(franchise, hasPackage, request.getPackageId(), request.getTestIds());
        String packageId = resolved.packageId();
        String packageName = resolved.packageName();
        List<LabTestBookingItem> items = resolved.items();

        UUID forFamilyMemberId = null;
        String forFamilyMemberName = null;
        if (request.getForFamilyMemberId() != null && !request.getForFamilyMemberId().isBlank()) {
            var member = familyMemberRepository
                    .findByIdAndPatientProfileId(parseId(request.getForFamilyMemberId(), "FamilyMember"), profile.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("FamilyMember", "id", request.getForFamilyMemberId()));
            forFamilyMemberId = member.getId();
            forFamilyMemberName = member.getFullName();
        }

        UUID addressId = null;
        PatientAddress resolvedAddress = null;
        if (request.getAddressId() != null && !request.getAddressId().isBlank()) {
            resolvedAddress = patientAddressRepository
                    .findByIdAndPatientProfileId(parseId(request.getAddressId(), "Address"), profile.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));
            addressId = resolvedAddress.getId();
        }

        BigDecimal subtotal = items.stream().map(LabTestBookingItem::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal collectionCharge = resolveCollectionCharge(franchise, request.getCollectionMethod(), subtotal);
        String couponCode = request.getCouponCode();
        BigDecimal discount = (couponCode != null && !couponCode.isBlank())
                ? couponService.redeem(franchise.getId(), couponCode, subtotal.add(collectionCharge))
                : BigDecimal.ZERO;
        BigDecimal gst = itemGst(items, subtotal, discount);
        BigDecimal totalAmount = subtotal.subtract(discount).max(BigDecimal.ZERO).add(collectionCharge).add(gst);

        LabTestBooking booking = new LabTestBooking();
        booking.setFranchiseId(franchise.getId());
        booking.setPatientEmail(patientEmail);
        booking.setPackageId(packageId != null ? UUID.fromString(packageId) : null);
        booking.setPackageName(packageName);
        booking.setForFamilyMemberId(forFamilyMemberId);
        booking.setForFamilyMemberName(forFamilyMemberName);
        booking.setCollectionMethod(request.getCollectionMethod());
        booking.setAddressId(addressId);
        if (resolvedAddress != null) {
            booking.setAddressLabel(resolvedAddress.getLabel());
            booking.setAddressLine1(resolvedAddress.getLine1());
            booking.setAddressLine2(resolvedAddress.getLine2());
            booking.setAddressCity(resolvedAddress.getCity());
            booking.setAddressState(resolvedAddress.getState());
            booking.setAddressPincode(resolvedAddress.getPincode());
        }
        booking.setCollectionDate(request.getCollectionDate());
        booking.setCollectionSlot(request.getCollectionSlot());
        booking.setCollectionStatus(CollectionStatus.SCHEDULED);
        booking.setStatus(BookingStatus.SAMPLE_COLLECTION_SCHEDULED);
        booking.setSubtotal(subtotal);
        booking.setDiscount(discount);
        booking.setCollectionCharge(collectionCharge);
        booking.setGst(gst);
        booking.setTotalAmount(totalAmount);
        booking.setCouponCode(couponCode != null && !couponCode.isBlank() ? couponCode.trim().toUpperCase() : null);
        // Booking always starts unpaid, regardless of method — CASH waits on the owner confirming
        // it was collected (#markPaid); ONLINE waits on a real Razorpay payment being verified
        // (#verifyOnlinePayment) rather than being mock-marked paid the instant a Razorpay Order
        // merely gets created below (creating an order costs nothing and proves nothing was paid).
        boolean isCash = request.getPaymentMethod() == PaymentMethod.CASH;
        booking.setPaymentStatus(PaymentStatus.PENDING);
        booking.setAmountPaid(BigDecimal.ZERO);
        booking.setCreatedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);

        for (LabTestBookingItem item : items) {
            item.setBookingId(booking.getId());
            bookingItemRepository.save(item);
        }

        Payment payment = new Payment();
        payment.setBookingId(booking.getId());
        payment.setFranchiseId(franchise.getId());
        payment.setPatientEmail(patientEmail);
        payment.setPatientName(displayName(patient));
        payment.setAmount(totalAmount);
        payment.setAmountPaid(BigDecimal.ZERO);
        payment.setMethod(request.getPaymentMethod());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setRefundStatus(RefundStatus.NONE);
        payment.setCreatedAt(booking.getCreatedAt());

        String razorpayOrderId = null;
        if (!isCash) {
            RazorpayService.RazorpayOrder order = razorpayService.createOrder(franchise, totalAmount, booking.getId().toString());
            razorpayOrderId = order.orderId();
            payment.setRazorpayOrderId(razorpayOrderId);
        }
        paymentRepository.save(payment);

        String itemsSummary = packageName != null ? packageName : items.stream().map(LabTestBookingItem::getItemName).reduce((a, b) -> a + ", " + b).orElse("test");
        // Async — see BookingEventProducer/BookingEventListener. Unlike every other notification
        // trigger in this app (direct, synchronous calls into NotificationService), this one path
        // goes through Kafka, decoupling notification delivery from the booking response.
        bookingEventProducer.publishBookingCreated(new BookingCreatedEvent(
                booking.getId().toString(), franchise.getId().toString(), patientEmail, displayName(patient), itemsSummary));

        LabTestBookingResponse response = toResponse(booking, items, patient.getId().toString(), displayName(patient), profile.getPhone());
        response.setRazorpayOrderId(razorpayOrderId);
        return response;
    }

    /**
     * Owner-entered booking for a walk-in patient at the counter — the
     * counter-billing analog for lab tests (see billing.BillingService
     * #createCounterBill). Always LAB_VISIT (the customer is physically
     * present, so there's no address/family-member/phone-on-file to
     * resolve) and marked collected immediately since staff takes the
     * sample right there — it never passes through SCHEDULED/ASSIGNED, so
     * there's nothing for the owner to "assign a technician" to. Payment
     * can be recorded as pending, partial, or in full — see #recordPayment
     * for topping up a pending/partial one later.
     */
    @Transactional
    public LabTestBookingResponse createWalkInBooking(String ownerEmail, WalkInBookingRequest request) {
        boolean hasTests = request.getTestIds() != null && !request.getTestIds().isEmpty();
        boolean hasPackage = request.getPackageId() != null && !request.getPackageId().isBlank();
        if (hasTests == hasPackage) {
            throw new BusinessException("Book either individual tests or a package, not both");
        }

        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        ResolvedItems resolved = resolveItems(franchise, hasPackage, request.getPackageId(), request.getTestIds());
        List<LabTestBookingItem> items = resolved.items();

        BigDecimal subtotal = items.stream().map(LabTestBookingItem::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal gst = itemGst(items, subtotal, BigDecimal.ZERO);
        BigDecimal totalAmount = subtotal.add(gst);
        // Lets the owner backdate a walk-in entered after the fact (e.g. catching up paper records at day's end).
        LocalDateTime now = request.getCreatedAt() != null ? request.getCreatedAt() : LocalDateTime.now();

        BigDecimal amountPaid = request.getAmountPaid() != null ? request.getAmountPaid() : BigDecimal.ZERO;
        if (amountPaid.compareTo(totalAmount) > 0) {
            amountPaid = totalAmount;
        }
        PaymentStatus paymentStatus = resolvePaymentStatus(amountPaid, totalAmount);

        String referralId = null;
        String referralName = null;
        BigDecimal referralCommission = null;
        if (request.getReferralId() != null && !request.getReferralId().isBlank()) {
            Referral referral = referralRepository.findByIdAndFranchiseId(parseId(request.getReferralId(), "Referral"), franchise.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Referral", "id", request.getReferralId()));
            referralId = referral.getId().toString();
            referralName = referral.getName();
            referralCommission = referral.getCommissionType() == CommissionType.PERCENTAGE
                    ? totalAmount.multiply(referral.getCommissionValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                    : referral.getCommissionValue();
        }

        String patientEmail = request.getPatientEmail() != null && !request.getPatientEmail().isBlank()
                ? request.getPatientEmail().trim().toLowerCase()
                : null;

        LabTestBooking booking = new LabTestBooking();
        booking.setFranchiseId(franchise.getId());
        booking.setPatientEmail(patientEmail);
        booking.setCustomerName(request.getCustomerName());
        booking.setCustomerPhone(request.getCustomerPhone());
        booking.setSource(BookingSource.FRANCHISE_COUNTER);
        booking.setPackageId(resolved.packageId() != null ? UUID.fromString(resolved.packageId()) : null);
        booking.setPackageName(resolved.packageName());
        booking.setCollectionMethod(CollectionMethod.LAB_VISIT);
        booking.setCollectionDate(now.toLocalDate());
        booking.setCollectionStatus(CollectionStatus.SAMPLE_COLLECTED);
        booking.setStatus(BookingStatus.SAMPLE_COLLECTED);
        booking.setSubtotal(subtotal);
        booking.setDiscount(BigDecimal.ZERO);
        booking.setCollectionCharge(BigDecimal.ZERO);
        booking.setGst(gst);
        booking.setTotalAmount(totalAmount);
        booking.setCouponCode(request.getCouponCode());
        booking.setPaymentStatus(paymentStatus);
        booking.setAmountPaid(amountPaid);
        booking.setCreatedAt(now);
        booking.setPaidAt(paymentStatus == PaymentStatus.SUCCESS ? now : null);
        booking.setReferralId(referralId != null ? UUID.fromString(referralId) : null);
        booking.setReferralName(referralName);
        booking.setReferralCommission(referralCommission);
        booking = bookingRepository.save(booking);

        for (LabTestBookingItem item : items) {
            item.setBookingId(booking.getId());
            bookingItemRepository.save(item);
        }

        Payment payment = new Payment();
        payment.setBookingId(booking.getId());
        payment.setFranchiseId(franchise.getId());
        payment.setPatientEmail(patientEmail);
        payment.setPatientName(request.getCustomerName());
        payment.setAmount(totalAmount);
        payment.setAmountPaid(amountPaid);
        payment.setMethod(PaymentMethod.CASH);
        payment.setStatus(paymentStatus);
        payment.setRefundStatus(RefundStatus.NONE);
        payment.setCreatedAt(now);
        payment.setPaidAt(paymentStatus == PaymentStatus.SUCCESS ? now : null);
        paymentRepository.save(payment);
        recordPaymentHistory(booking.getId(), amountPaid);

        if (patientEmail != null) {
            String itemsSummary = resolved.packageName() != null
                    ? resolved.packageName()
                    : items.stream().map(LabTestBookingItem::getItemName).reduce((a, b) -> a + ", " + b).orElse("test");
            notificationService.notifyPatient(patientEmail, NotificationType.BOOKING_CONFIRMATION,
                    "Booking confirmed", "Your booking for " + itemsSummary + " has been recorded. Sign in with this email to view it.");
        }

        return toResponseWithItems(booking);
    }

    /**
     * Owner action — corrects a walk-in booking entered at the counter
     * (wrong test picked, GST missing, mistyped name, etc). Only
     * FRANCHISE_COUNTER bookings can be edited here; a patient's own online
     * booking should be cancelled, not silently rewritten by the owner.
     * Re-resolves items from scratch (same as creation) so totals/GST always
     * reflect the current catalog + request, never a stale computation.
     */
    @Transactional
    public LabTestBookingResponse updateWalkInBooking(String ownerEmail, String bookingId, WalkInBookingRequest request) {
        boolean hasTests = request.getTestIds() != null && !request.getTestIds().isEmpty();
        boolean hasPackage = request.getPackageId() != null && !request.getPackageId().isBlank();
        if (hasTests == hasPackage) {
            throw new BusinessException("Book either individual tests or a package, not both");
        }

        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestBooking booking = bookingRepository.findByIdAndFranchiseId(parseId(bookingId, "Booking"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        if (booking.getSource() != BookingSource.FRANCHISE_COUNTER) {
            throw new BusinessException("Only walk-in bookings can be edited here");
        }

        ResolvedItems resolved = resolveItems(franchise, hasPackage, request.getPackageId(), request.getTestIds());
        List<LabTestBookingItem> items = resolved.items();

        BigDecimal subtotal = items.stream().map(LabTestBookingItem::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal gst = itemGst(items, subtotal, BigDecimal.ZERO);
        BigDecimal totalAmount = subtotal.add(gst);

        // Defaults to whatever was already recorded as paid, rather than 0, so an edit that isn't
        // about payment (e.g. fixing GST) doesn't silently wipe out a payment already collected.
        BigDecimal amountPaid = request.getAmountPaid() != null ? request.getAmountPaid() : booking.getAmountPaid();
        if (amountPaid.compareTo(totalAmount) > 0) {
            amountPaid = totalAmount;
        }
        PaymentStatus paymentStatus = resolvePaymentStatus(amountPaid, totalAmount);

        String referralId = null;
        String referralName = null;
        BigDecimal referralCommission = null;
        if (request.getReferralId() != null && !request.getReferralId().isBlank()) {
            Referral referral = referralRepository.findByIdAndFranchiseId(parseId(request.getReferralId(), "Referral"), franchise.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Referral", "id", request.getReferralId()));
            referralId = referral.getId().toString();
            referralName = referral.getName();
            referralCommission = referral.getCommissionType() == CommissionType.PERCENTAGE
                    ? totalAmount.multiply(referral.getCommissionValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                    : referral.getCommissionValue();
        }

        String patientEmail = request.getPatientEmail() != null && !request.getPatientEmail().isBlank()
                ? request.getPatientEmail().trim().toLowerCase()
                : null;

        booking.setPatientEmail(patientEmail);
        booking.setCustomerName(request.getCustomerName());
        booking.setCustomerPhone(request.getCustomerPhone());
        booking.setPackageId(resolved.packageId() != null ? UUID.fromString(resolved.packageId()) : null);
        booking.setPackageName(resolved.packageName());
        booking.setSubtotal(subtotal);
        booking.setGst(gst);
        booking.setTotalAmount(totalAmount);
        booking.setCouponCode(request.getCouponCode());
        booking.setPaymentStatus(paymentStatus);
        booking.setAmountPaid(amountPaid);
        booking.setPaidAt(paymentStatus == PaymentStatus.SUCCESS ? (booking.getPaidAt() != null ? booking.getPaidAt() : LocalDateTime.now()) : null);
        booking.setReferralId(referralId != null ? UUID.fromString(referralId) : null);
        booking.setReferralName(referralName);
        booking.setReferralCommission(referralCommission);
        bookingRepository.save(booking);

        bookingItemRepository.deleteByBookingId(booking.getId());
        for (LabTestBookingItem item : items) {
            item.setBookingId(booking.getId());
            bookingItemRepository.save(item);
        }

        BigDecimal finalAmountPaid = amountPaid;
        paymentRepository.findByBookingId(booking.getId()).ifPresent(payment -> {
            payment.setPatientEmail(patientEmail);
            payment.setPatientName(request.getCustomerName());
            payment.setAmount(totalAmount);
            payment.setAmountPaid(finalAmountPaid);
            payment.setStatus(paymentStatus);
            payment.setPaidAt(booking.getPaidAt());
            paymentRepository.save(payment);
        });

        return toResponseWithItems(booking);
    }

    /**
     * Owner action — removes a walk-in booking entirely (e.g. it was entered
     * by mistake). Only FRANCHISE_COUNTER bookings can be deleted here; a
     * patient's own online booking should be cancelled instead, never erased.
     */
    @Transactional
    public void deleteWalkInBooking(String ownerEmail, String bookingId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestBooking booking = bookingRepository.findByIdAndFranchiseId(parseId(bookingId, "Booking"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        if (booking.getSource() != BookingSource.FRANCHISE_COUNTER) {
            throw new BusinessException("Only walk-in bookings can be deleted here — cancel a patient booking instead.");
        }

        labReportRepository.findByBookingId(booking.getId()).ifPresent(labReportRepository::delete);
        paymentHistoryRepository.deleteBySourceTypeAndSourceId(PaymentSourceType.BOOKING, booking.getId());
        paymentRepository.findByBookingId(booking.getId()).ifPresent(paymentRepository::delete);
        bookingItemRepository.deleteByBookingId(booking.getId());
        bookingRepository.delete(booking);
    }

    /** Owner action — records an additional payment collected towards a booking (walk-in or otherwise), topping up whatever's already been paid. */
    @Transactional
    public LabTestBookingResponse recordPayment(String ownerEmail, String bookingId, BigDecimal amount) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestBooking booking = bookingRepository.findByIdAndFranchiseId(parseId(bookingId, "Booking"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Payment amount must be positive");
        }

        BigDecimal newAmountPaid = booking.getAmountPaid().add(amount).min(booking.getTotalAmount());
        PaymentStatus status = resolvePaymentStatus(newAmountPaid, booking.getTotalAmount());
        LocalDateTime now = LocalDateTime.now();

        booking.setAmountPaid(newAmountPaid);
        booking.setPaymentStatus(status);
        if (status == PaymentStatus.SUCCESS) {
            booking.setPaidAt(now);
        }
        bookingRepository.save(booking);

        paymentRepository.findByBookingId(booking.getId()).ifPresent(payment -> {
            payment.setAmountPaid(newAmountPaid);
            payment.setStatus(status);
            if (status == PaymentStatus.SUCCESS) {
                payment.setPaidAt(now);
            }
            paymentRepository.save(payment);
        });
        recordPaymentHistory(booking.getId(), amount);

        if (status == PaymentStatus.SUCCESS) {
            notificationService.notifyPatient(booking.getPatientEmail(), NotificationType.PAYMENT_SUCCESS,
                    "Payment received", "Your payment of ₹" + booking.getTotalAmount() + " has been confirmed.");
        }

        return toResponseWithItems(booking);
    }

    private void recordPaymentHistory(UUID bookingId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }
        PaymentHistory entry = new PaymentHistory();
        entry.setSourceType(PaymentSourceType.BOOKING);
        entry.setSourceId(bookingId);
        entry.setAmount(amount);
        entry.setRecordedAt(LocalDateTime.now());
        paymentHistoryRepository.save(entry);
    }

    private PaymentStatus resolvePaymentStatus(BigDecimal amountPaid, BigDecimal totalAmount) {
        if (amountPaid.compareTo(totalAmount) >= 0) {
            return PaymentStatus.SUCCESS;
        }
        if (amountPaid.compareTo(BigDecimal.ZERO) > 0) {
            return PaymentStatus.PARTIALLY_PAID;
        }
        return PaymentStatus.PENDING;
    }

    @Transactional(readOnly = true)
    public List<LabTestBookingResponse> listForOwner(String ownerEmail) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        return bookingRepository.findByFranchiseIdOrderByCreatedAtDesc(franchise.getId())
                .stream()
                .map(this::toResponseWithItems)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LabTestBookingResponse> listForPatient(String patientEmail) {
        return bookingRepository.findByPatientEmailOrderByCreatedAtDesc(patientEmail)
                .stream()
                .map(this::toResponseWithItems)
                .toList();
    }

    @Transactional(readOnly = true)
    public LabTestBookingResponse getForPatient(String patientEmail, String bookingId) {
        LabTestBooking booking = bookingRepository.findByIdAndPatientEmail(parseId(bookingId, "Booking"), patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        return toResponseWithItems(booking);
    }

    /** The franchise owner confirming a CASH booking was actually paid at the visit. */
    @Transactional
    public LabTestBookingResponse markPaid(String ownerEmail, String bookingId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestBooking booking = bookingRepository.findByIdAndFranchiseId(parseId(bookingId, "Booking"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (booking.getPaymentStatus() != PaymentStatus.SUCCESS) {
            BigDecimal alreadyPaid = booking.getAmountPaid();
            booking.setPaymentStatus(PaymentStatus.SUCCESS);
            booking.setAmountPaid(booking.getTotalAmount());
            booking.setPaidAt(LocalDateTime.now());
            bookingRepository.save(booking);

            paymentRepository.findByBookingId(booking.getId()).ifPresent(payment -> {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setAmountPaid(payment.getAmount());
                payment.setPaidAt(booking.getPaidAt());
                paymentRepository.save(payment);
            });
            recordPaymentHistory(booking.getId(), booking.getTotalAmount().subtract(alreadyPaid));

            notificationService.notifyPatient(booking.getPatientEmail(), NotificationType.PAYMENT_SUCCESS,
                    "Payment received", "Your payment of ₹" + booking.getTotalAmount() + " has been confirmed.");
        }

        return toResponseWithItems(booking);
    }

    /**
     * The patient's browser calling back after Razorpay's Checkout.js reports success — this is
     * the ONLY thing that actually marks an online booking paid; nothing about the checkout popup
     * closing "successfully" on the frontend is trusted on its own; see RazorpayService#verifySignature.
     * Idempotent: calling it again on an already-verified booking is a no-op, not an error, since a
     * flaky network can plausibly cause a browser to retry this call after it already succeeded.
     */
    @Transactional
    public LabTestBookingResponse verifyOnlinePayment(String patientEmail, String bookingId, String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        LabTestBooking booking = bookingRepository.findByIdAndPatientEmail(parseId(bookingId, "Booking"), patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        if (booking.getPaymentStatus() == PaymentStatus.SUCCESS) {
            return toResponseWithItems(booking);
        }

        Payment payment = paymentRepository.findByBookingId(booking.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "bookingId", bookingId));
        if (payment.getRazorpayOrderId() == null || !payment.getRazorpayOrderId().equals(razorpayOrderId)) {
            throw new BusinessException("This payment doesn't match this booking — please try again.");
        }

        Franchise franchise = franchiseRepository.findById(booking.getFranchiseId())
                .orElseThrow(() -> new ResourceNotFoundException("Franchise", "id", booking.getFranchiseId().toString()));
        if (!razorpayService.verifySignature(franchise, razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            throw new BusinessException("Payment verification failed — if money was deducted, contact the lab; otherwise please try again.");
        }

        LocalDateTime now = LocalDateTime.now();
        booking.setPaymentStatus(PaymentStatus.SUCCESS);
        booking.setAmountPaid(booking.getTotalAmount());
        booking.setPaidAt(now);
        bookingRepository.save(booking);

        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setAmountPaid(payment.getAmount());
        payment.setPaidAt(now);
        payment.setRazorpayPaymentId(razorpayPaymentId);
        paymentRepository.save(payment);
        recordPaymentHistory(booking.getId(), payment.getAmount());

        notificationService.notifyPatient(patientEmail, NotificationType.PAYMENT_SUCCESS,
                "Payment received", "Your payment of ₹" + booking.getTotalAmount() + " has been confirmed.");

        return toResponseWithItems(booking);
    }

    /** Owner viewing/printing the invoice PDF for one of their own bookings — see PatientLabTestBookingController for the patient-facing equivalent. */
    @Transactional(readOnly = true)
    public byte[] renderInvoicePdf(String ownerEmail, String bookingId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestBooking booking = bookingRepository.findByIdAndFranchiseId(parseId(bookingId, "Booking"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        List<LabTestBookingItem> items = bookingItemRepository.findByBookingIdOrderByItemOrder(booking.getId());
        return invoicePdfService.renderBookingInvoice(franchise, booking, items);
    }

    /** A patient viewing/printing the invoice PDF for one of their own bookings. */
    @Transactional(readOnly = true)
    public byte[] renderInvoicePdfForPatient(String patientEmail, String bookingId) {
        LabTestBooking booking = bookingRepository.findByIdAndPatientEmail(parseId(bookingId, "Booking"), patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        Franchise franchise = franchiseRepository.findById(booking.getFranchiseId())
                .orElseThrow(() -> new ResourceNotFoundException("Franchise", "id", booking.getFranchiseId().toString()));
        List<LabTestBookingItem> items = bookingItemRepository.findByBookingIdOrderByItemOrder(booking.getId());
        return invoicePdfService.renderBookingInvoice(franchise, booking, items);
    }

    /** Owner action — advances a booking's sample-collection status (and the overall status along with it). */
    @Transactional
    public LabTestBookingResponse updateCollectionStatus(String ownerEmail, String bookingId, CollectionStatus collectionStatus) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestBooking booking = bookingRepository.findByIdAndFranchiseId(parseId(bookingId, "Booking"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        booking.setCollectionStatus(collectionStatus);
        BookingStatus derived = BOOKING_STATUS_FOR_COLLECTION.get(collectionStatus);
        if (derived != null) {
            booking.setStatus(derived);
        }
        bookingRepository.save(booking);

        return toResponseWithItems(booking);
    }

    /** Owner action — cancels a booking outright. */
    @Transactional
    public LabTestBookingResponse cancelBooking(String ownerEmail, String bookingId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestBooking booking = bookingRepository.findByIdAndFranchiseId(parseId(bookingId, "Booking"), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCollectionStatus(CollectionStatus.CANCELLED);
        bookingRepository.save(booking);

        return toResponseWithItems(booking);
    }

    /** Resolves either a package (expanded into its constituent tests) or a raw list of test ids into booking-item rows. Shared by bookTest and createWalkInBooking. */
    private ResolvedItems resolveItems(Franchise franchise, boolean hasPackage, String packageIdStr, List<String> testIds) {
        List<LabTestBookingItem> items = new ArrayList<>();
        String packageId = null;
        String packageName = null;

        if (hasPackage) {
            UUID comboId = parseId(packageIdStr, "LabTestCombo");
            LabTestCombo combo = labTestComboRepository.findByIdAndFranchiseId(comboId, franchise.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("LabTestCombo", "id", packageIdStr));
            packageId = combo.getId().toString();
            packageName = combo.getName();
            int order = 0;
            for (LabTest test : combo.getTests()) {
                items.add(newItem(test.getId(), test.getName(), test.getPrice(), test.getGstPercentage(), order++));
            }
        } else {
            int order = 0;
            for (String testIdStr : testIds) {
                UUID testId = parseId(testIdStr, "LabTest");
                LabTest test = labTestRepository.findByIdAndFranchiseId(testId, franchise.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("LabTest", "id", testIdStr));
                items.add(newItem(test.getId(), test.getName(), test.getPrice(), test.getGstPercentage(), order++));
            }
        }

        return new ResolvedItems(packageId, packageName, items);
    }

    private record ResolvedItems(String packageId, String packageName, List<LabTestBookingItem> items) {
    }

    /** LAB_VISIT is always free. HOME_COLLECTION is charged unless the franchise has set a free-collection threshold the subtotal meets. */
    private BigDecimal resolveCollectionCharge(Franchise franchise, CollectionMethod method, BigDecimal subtotal) {
        if (method != CollectionMethod.HOME_COLLECTION) {
            return BigDecimal.ZERO;
        }
        BigDecimal minOrder = franchise.getFreeCollectionMinOrder();
        if (minOrder != null && subtotal.compareTo(minOrder) >= 0) {
            return BigDecimal.ZERO;
        }
        return franchise.getCollectionCharge();
    }

    private LabTestBookingItem newItem(UUID labTestId, String name, BigDecimal price, BigDecimal gstPercentage, int order) {
        LabTestBookingItem item = new LabTestBookingItem();
        item.setLabTestId(labTestId);
        item.setItemName(name);
        item.setAmount(price);
        item.setGstPercentage(gstPercentage != null ? gstPercentage : BigDecimal.ZERO);
        item.setItemOrder(order);
        return item;
    }

    /**
     * Sums each item's own GST (snapshotted per test, not a flat platform-wide
     * rate) — replaces the old hardcoded 5%-on-everything calculation. Any
     * discount is spread proportionally across items before computing GST on
     * the taxable remainder, same as how discount already reduces the taxable
     * base for the flat-rate calculation this replaces.
     */
    private BigDecimal itemGst(List<LabTestBookingItem> items, BigDecimal subtotal, BigDecimal discount) {
        BigDecimal ratio = BigDecimal.ONE;
        if (discount != null && discount.compareTo(BigDecimal.ZERO) > 0 && subtotal.compareTo(BigDecimal.ZERO) > 0) {
            ratio = subtotal.subtract(discount).max(BigDecimal.ZERO).divide(subtotal, 10, RoundingMode.HALF_UP);
        }
        BigDecimal total = BigDecimal.ZERO;
        for (LabTestBookingItem item : items) {
            BigDecimal taxableAmount = item.getAmount().multiply(ratio);
            BigDecimal itemGstAmount = taxableAmount.multiply(item.getGstPercentage())
                    .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP);
            total = total.add(itemGstAmount);
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private String displayName(UserAuth user) {
        return user.getFullName() != null && !user.getFullName().isBlank() ? user.getFullName() : user.getEmail();
    }

    private UUID parseId(String id, String resourceName) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException(resourceName, "id", id);
        }
    }

    private LabTestBookingResponse toResponseWithItems(LabTestBooking booking) {
        List<LabTestBookingItem> items = bookingItemRepository.findByBookingIdOrderByItemOrder(booking.getId());
        if (booking.getPatientEmail() == null) {
            return toResponse(booking, items, null, booking.getCustomerName(), booking.getCustomerPhone());
        }
        UserAuth patient = userAuthRepository.findByEmail(booking.getPatientEmail()).orElse(null);
        // A walk-in booking can have patientEmail set (see #createWalkInBooking) before that
        // email has ever actually signed in — customerName/customerPhone are the best display
        // fallback until a real account exists to take over.
        String fallbackName = booking.getCustomerName() != null ? booking.getCustomerName() : booking.getPatientEmail();
        String patientName = patient != null ? displayName(patient) : fallbackName;
        String patientId = patient != null ? patient.getId().toString() : null;
        String phone = patient != null
                ? patientProfileRepository.findByUserId(patient.getId()).map(PatientProfile::getPhone).orElse(booking.getCustomerPhone())
                : booking.getCustomerPhone();
        return toResponse(booking, items, patientId, patientName, phone);
    }

    private LabTestBookingResponse toResponse(LabTestBooking booking, List<LabTestBookingItem> items, String patientId, String patientName, String phone) {
        List<LabTestBookingItemResponse> itemResponses = items.stream()
                .map(i -> new LabTestBookingItemResponse(
                        i.getLabTestId() != null ? i.getLabTestId().toString() : null,
                        i.getItemName(),
                        i.getAmount(),
                        i.getGstPercentage()
                ))
                .toList();

        List<PaymentHistoryEntryResponse> paymentHistory = paymentHistoryRepository
                .findBySourceTypeAndSourceIdOrderByRecordedAtAsc(PaymentSourceType.BOOKING, booking.getId())
                .stream()
                .map(h -> new PaymentHistoryEntryResponse(h.getAmount(), h.getRecordedAt()))
                .toList();

        LabReport report = labReportRepository.findByBookingId(booking.getId()).orElse(null);
        LocalDateTime reportExpiresAt = report != null ? report.getUploadedAt().plusDays(LabReportService.RETENTION_DAYS) : null;

        return new LabTestBookingResponse(
                booking.getId().toString(),
                patientId,
                booking.getPatientEmail(),
                patientName,
                phone,
                booking.getSource(),
                booking.getForFamilyMemberId() != null ? booking.getForFamilyMemberId().toString() : null,
                booking.getForFamilyMemberName(),
                itemResponses,
                booking.getPackageId() != null ? booking.getPackageId().toString() : null,
                booking.getPackageName(),
                booking.getCollectionMethod(),
                booking.getAddressId() != null ? booking.getAddressId().toString() : null,
                booking.getAddressLabel(),
                booking.getAddressLine1(),
                booking.getAddressLine2(),
                booking.getAddressCity(),
                booking.getAddressState(),
                booking.getAddressPincode(),
                booking.getCollectionDate(),
                booking.getCollectionSlot(),
                booking.getCollectionStatus(),
                booking.getStatus(),
                booking.getSubtotal(),
                booking.getDiscount(),
                booking.getCollectionCharge(),
                booking.getGst(),
                booking.getTotalAmount(),
                booking.getPaymentStatus(),
                booking.getAmountPaid(),
                booking.getCouponCode(),
                booking.getCreatedAt(),
                booking.getPaidAt(),
                report != null,
                reportExpiresAt,
                booking.getReferralId() != null ? booking.getReferralId().toString() : null,
                booking.getReferralName(),
                booking.getReferralCommission(),
                paymentHistory,
                // Only bookTest()'s own return value fills this in (see its setRazorpayOrderId
                // call below) — every other caller of this shared builder doesn't need it, and a
                // Payment lookup here would add an extra query to every list-view row for nothing.
                null
        );
    }
}
