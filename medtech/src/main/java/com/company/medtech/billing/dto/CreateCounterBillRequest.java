package com.company.medtech.billing.dto;

import com.company.medtech.billing.model.DiscountType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateCounterBillRequest {

    @NotEmpty
    @Valid
    private List<BillItemRequest> items;

    private String customerName;
    private String customerPhone;

    /** Both optional — omit or leave discountValue unset/zero for no discount. */
    private DiscountType discountType;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal discountValue;

    /** Optional — the coupon code that produced discountType/discountValue, printed on the invoice. */
    private String couponCode;

    /** Optional free-text note printed on this invoice. */
    private String note;

    /** Optional — the doctor or other person who referred this customer in. */
    private String referralId;

    /** Optional — lets the owner backdate a walk-in sale entered after the fact. Defaults to now if omitted. */
    private LocalDateTime createdAt;
}
