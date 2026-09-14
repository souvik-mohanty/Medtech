package com.company.medtech.lab.service;

import com.company.medtech.common.exceptions.BusinessException;
import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.lab.model.BookingStatus;
import com.company.medtech.lab.model.LabReport;
import com.company.medtech.lab.model.LabTestBooking;
import com.company.medtech.lab.repository.LabReportRepository;
import com.company.medtech.lab.repository.LabTestBookingRepository;
import com.company.medtech.notification.model.NotificationType;
import com.company.medtech.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Owner uploads a PDF report per booking; the patient (and owner) can then
 * download it — until RETENTION_DAYS after upload, when the daily cleanup
 * job below removes it from the server for good (storage isn't meant to be
 * a permanent archive here).
 */
@Service
public class LabReportService {

    private static final Logger log = LoggerFactory.getLogger(LabReportService.class);

    /** How long an uploaded report stays downloadable before the cleanup job deletes it — see #deleteExpiredReports. */
    public static final int RETENTION_DAYS = 15;

    private final LabReportRepository reportRepository;
    private final LabTestBookingRepository bookingRepository;
    private final FranchiseService franchiseService;
    private final NotificationService notificationService;

    public LabReportService(
            LabReportRepository reportRepository,
            LabTestBookingRepository bookingRepository,
            FranchiseService franchiseService,
            NotificationService notificationService
    ) {
        this.reportRepository = reportRepository;
        this.bookingRepository = bookingRepository;
        this.franchiseService = franchiseService;
        this.notificationService = notificationService;
    }

    @Transactional
    public void upload(String ownerEmail, String bookingId, MultipartFile file) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestBooking booking = bookingRepository.findByIdAndFranchiseId(parseId(bookingId), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        if (file == null || file.isEmpty()) {
            throw new BusinessException("No file was uploaded");
        }
        if (!"application/pdf".equals(file.getContentType())) {
            throw new BusinessException("Only PDF files are accepted");
        }

        LabReport report = reportRepository.findByBookingId(booking.getId()).orElseGet(LabReport::new);
        report.setBookingId(booking.getId());
        report.setFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "report.pdf");
        report.setContentType(file.getContentType());
        try {
            report.setFileData(file.getBytes());
        } catch (IOException e) {
            throw new BusinessException("Couldn't read the uploaded file");
        }
        report.setUploadedAt(LocalDateTime.now());
        reportRepository.save(report);

        if (booking.getStatus() != BookingStatus.COMPLETED && booking.getStatus() != BookingStatus.CANCELLED) {
            booking.setStatus(BookingStatus.REPORT_READY);
            bookingRepository.save(booking);
        }

        notificationService.notifyPatient(booking.getPatientEmail(), NotificationType.REPORT_READY,
                "Report ready", "Your lab report is ready to view.");
    }

    /** Runs once a day — deletes any report whose RETENTION_DAYS window has passed. hasReport/reportExpiresAt on the booking response simply reflect the row being gone. */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void deleteExpiredReports() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(RETENTION_DAYS);
        List<LabReport> expired = reportRepository.findByUploadedAtBefore(cutoff);
        if (expired.isEmpty()) {
            return;
        }
        reportRepository.deleteAll(expired);
        log.info("Deleted {} lab report(s) past the {}-day retention window", expired.size(), RETENTION_DAYS);
    }

    @Transactional(readOnly = true)
    public LabReport getForOwner(String ownerEmail, String bookingId) {
        Franchise franchise = franchiseService.getByOwnerEmail(ownerEmail);
        LabTestBooking booking = bookingRepository.findByIdAndFranchiseId(parseId(bookingId), franchise.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        return reportRepository.findByBookingId(booking.getId())
                .orElseThrow(() -> new ResourceNotFoundException("LabReport", "bookingId", bookingId));
    }

    @Transactional(readOnly = true)
    public LabReport getForPatient(String patientEmail, String bookingId) {
        LabTestBooking booking = bookingRepository.findByIdAndPatientEmail(parseId(bookingId), patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
        return reportRepository.findByBookingId(booking.getId())
                .orElseThrow(() -> new ResourceNotFoundException("LabReport", "bookingId", bookingId));
    }

    private UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Booking", "id", id);
        }
    }
}
