package com.company.medtech.patient.controller;

import com.company.medtech.common.response.ApiResponse;
import com.company.medtech.patient.dto.PatientSummaryResponse;
import com.company.medtech.patient.service.PatientDirectoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** The franchise owner's "who has booked with me" patient directory. */
@RestController
@RequestMapping(
        value = "/api/franchise/patients",
        produces = MediaType.APPLICATION_JSON_VALUE
)
@RequiredArgsConstructor
public class PatientDirectoryController {

    private final PatientDirectoryService patientDirectoryService;

    @GetMapping
    public ApiResponse<List<PatientSummaryResponse>> list(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success("OK", patientDirectoryService.list(authentication.getName(), search, status));
    }
}
