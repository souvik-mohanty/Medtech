package com.company.medtech.notification.dto;

import com.company.medtech.notification.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class NotificationResponse {

    private String id;
    private NotificationType type;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
