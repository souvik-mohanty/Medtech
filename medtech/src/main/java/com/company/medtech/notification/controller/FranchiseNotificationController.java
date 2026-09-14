package com.company.medtech.notification.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.franchise.model.Franchise;
import com.company.medtech.franchise.service.FranchiseService;
import com.company.medtech.notification.dto.NotificationResponse;
import com.company.medtech.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** The franchise owner's own notifications — new bookings, orders, payments, and so on. */
@RestController
@RequestMapping(
        value = "/api/franchise/notifications",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class FranchiseNotificationController {

    private final NotificationService notificationService;
    private final FranchiseService franchiseService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> list(Authentication authentication) {
        Franchise franchise = franchiseService.getByOwnerEmail(authentication.getName());
        return ApiResponse.success("OK", notificationService.listForFranchise(franchise.getId()));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> unreadCount(Authentication authentication) {
        Franchise franchise = franchiseService.getByOwnerEmail(authentication.getName());
        return ApiResponse.success("OK", Map.of("count", notificationService.unreadCountForFranchise(franchise.getId())));
    }
}
