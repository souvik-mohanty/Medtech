package com.company.medtech.notification.service;

import com.company.medtech.common.exceptions.ResourceNotFoundException;
import com.company.medtech.notification.dto.NotificationResponse;
import com.company.medtech.notification.model.Notification;
import com.company.medtech.notification.model.NotificationType;
import com.company.medtech.notification.model.RecipientType;
import com.company.medtech.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Almost every side-effect hook lives in the service that causes it
 * (payment confirmation, report upload, walk-in booking, etc.) — those
 * call #notifyFranchise / #notifyPatient directly, keeping the trigger
 * point easy to find. The one exception: a patient's own online lab
 * booking (LabTestBookingService#bookTest) publishes a Kafka event instead
 * of calling this service directly — see notification.listener.
 * BookingEventListener, which is the only caller of these two methods that
 * isn't itself the thing that caused the notification.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void notifyFranchise(UUID franchiseId, NotificationType type, String title, String message) {
        Notification notification = new Notification();
        notification.setRecipientType(RecipientType.FRANCHISE);
        notification.setFranchiseId(franchiseId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    /** No-op if patientEmail is null — a walk-in customer has no account to notify. */
    @Transactional
    public void notifyPatient(String patientEmail, NotificationType type, String title, String message) {
        if (patientEmail == null || patientEmail.isBlank()) {
            return;
        }
        Notification notification = new Notification();
        notification.setRecipientType(RecipientType.PATIENT);
        notification.setPatientEmail(patientEmail);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForFranchise(UUID franchiseId) {
        return notificationRepository.findByFranchiseIdOrderByCreatedAtDesc(franchiseId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForPatient(String patientEmail) {
        return notificationRepository.findByPatientEmailOrderByCreatedAtDesc(patientEmail).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCountForFranchise(UUID franchiseId) {
        return notificationRepository.countByFranchiseIdAndReadFalse(franchiseId);
    }

    @Transactional(readOnly = true)
    public long unreadCountForPatient(String patientEmail) {
        return notificationRepository.countByPatientEmailAndReadFalse(patientEmail);
    }

    @Transactional
    public void markRead(String patientEmail, String id) {
        Notification notification = notificationRepository.findByIdAndPatientEmail(parseId(id), patientEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllRead(String patientEmail) {
        List<Notification> unread = notificationRepository.findByPatientEmailOrderByCreatedAtDesc(patientEmail).stream()
                .filter(n -> !n.isRead())
                .toList();
        for (Notification notification : unread) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void markReadForFranchise(UUID franchiseId, String id) {
        Notification notification = notificationRepository.findByIdAndFranchiseId(parseId(id), franchiseId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllReadForFranchise(UUID franchiseId) {
        List<Notification> unread = notificationRepository.findByFranchiseIdOrderByCreatedAtDesc(franchiseId).stream()
                .filter(n -> !n.isRead())
                .toList();
        for (Notification notification : unread) {
            notification.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    private UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new ResourceNotFoundException("Notification", "id", id);
        }
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId().toString(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
