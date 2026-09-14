package com.company.medtech.lab.dto;

import com.company.medtech.lab.model.CollectionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CollectionStatusUpdateRequest {

    @NotNull
    private CollectionStatus collectionStatus;
}
