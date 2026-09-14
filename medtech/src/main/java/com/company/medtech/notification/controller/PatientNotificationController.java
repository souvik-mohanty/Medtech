package com.company.medtech.notification.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.notification.dto.NotificationResponse;
import com.company.medtech.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** A patient's own notifications — booking confirmations, payment updates, report-ready alerts, and so on. */
@RestController
@RequestMapping(
        value = "/api/patient/notifications",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientNotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> list(Authentication authentication) {
        return ApiResponse.success("OK", notificationService.listForPatient(authentication.getName()));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> unreadCount(Authentication authentication) {
        return ApiResponse.success("OK", Map.of("count", notificationService.unreadCountForPatient(authentication.getName())));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markRead(Authentication authentication, @PathVariable String id) {
        notificationService.markRead(authentication.getName(), id);
        return ApiResponse.success("Marked read", null);
    }

    @PatchMapping("/mark-all-read")
    public ApiResponse<Void> markAllRead(Authentication authentication) {
        notificationService.markAllRead(authentication.getName());
        return ApiResponse.success("Marked all read", null);
    }
}
