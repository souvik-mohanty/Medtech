package com.company.medtech.consultation.model;

/**
 * LIMITED: capped at maxPatients, each booking gets the next serial number,
 * the doctor sees patients in that order during the visiting window.
 * REQUEST: unbounded "call me back" queue — no serial number, no cap.
 */
public enum SlotType {
    LIMITED,
    REQUEST
}
