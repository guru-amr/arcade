package com.arcade.dto;

import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

public class OrderDtos {

    public record CreateOrderRequest(
            MultipartFile file,
            int copies,
            String colorMode,
            String sides,
            String paperSize,
            String specialInstructions,
            String studentName,
            String studentEmail,
            String studentPhone
    ) {}

    public record CreateOrderResponse(
            Long orderId,
            String pickupCode,
            BigDecimal amount
    ) {}

    public record ConfirmPaymentRequest(
            String paymentStatus,
            String paymentReference
    ) {}

    public record PublicOrderSummary(
            Long id,
            String pickupCode,
            String fileName,
            int copies,
            String colorMode,
            String sides,
            String paperSize,
            String specialInstructions,
            BigDecimal amount,
            String paymentStatus
    ) {}

    public record VendorOrderListItem(
            Long id,
            String pickupCode,
            String studentName,
            String status,
            String paymentStatus,
            BigDecimal amount,
            String createdAt
    ) {}

    public record VendorOrderDetail(
            Long id,
            String pickupCode,
            String studentName,
            String studentEmail,
            String studentPhone,
            int copies,
            String colorMode,
            String sides,
            String paperSize,
            String specialInstructions,
            String status,
            String paymentStatus,
            String paymentReference,
            BigDecimal amount,
            String createdAt,
            String fileUrl
    ) {}

    public record StudentOrderItem(
            Long id,
            String pickupCode,
            String fileName,
            int copies,
            String status,
            String paymentStatus,
            BigDecimal amount,
            String createdAt
    ) {}

    public record StudentOrderDetail(
            Long id,
            String pickupCode,
            String fileName,
            int copies,
            String colorMode,
            String sides,
            String paperSize,
            String specialInstructions,
            String status,
            String paymentStatus,
            BigDecimal amount,
            String createdAt
    ) {}
}

