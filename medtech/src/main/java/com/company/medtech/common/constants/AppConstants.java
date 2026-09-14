package com.company.medtech.common.constants;

import java.util.Set;

public final class AppConstants {

    private AppConstants() {}

    // Roles
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT";
    public static final String ROLE_FRANCHISE = "FRANCHISE";
    public static final String ROLE_PATIENT = "PATIENT";
    public static final String ROLE_DOCTOR = "DOCTOR";
    public static final String ROLE_LAB_TECHNICIAN = "LAB_TECHNICIAN";
    public static final String ROLE_DELIVERY_PARTNER = "DELIVERY_PARTNER";

    /** Must log in with Google OAuth + their assigned franchise ID. */
    public static final Set<String> FRANCHISE_SCOPED_ROLES =
            Set.of(ROLE_DOCTOR, ROLE_LAB_TECHNICIAN, ROLE_DELIVERY_PARTNER);

    // Headers
    public static final String AUTH_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";

    // Date Formats
    public static final String DATE_FORMAT = "dd-MM-yyyy";
    public static final String DATE_TIME_FORMAT = "dd-MM-yyyy HH:mm:ss";
}
