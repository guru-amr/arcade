package com.arcade.controller;

import com.arcade.dto.OrderDtos;
import com.arcade.model.PrintOrder;
import com.arcade.repository.PrintOrderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Paths;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor/orders")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
public class VendorOrderController {

    private final PrintOrderRepository printOrderRepository;

    @Value("${arcade.upload-dir}")
    private String uploadDir;

    @Value("${ARCADE_VENDOR_FILE_BASE_URL:http://localhost:8080}")
    private String fileBaseUrl;

    public VendorOrderController(PrintOrderRepository printOrderRepository) {
        this.printOrderRepository = printOrderRepository;
    }

    @GetMapping
    public List<OrderDtos.VendorOrderListItem> listOrders(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "fromDate", required = false) String fromDate
    ) {
        Instant after = Instant.EPOCH;
        if ("TODAY".equalsIgnoreCase(fromDate)) {
            after = Instant.now().truncatedTo(ChronoUnit.DAYS);
        } else if ("LAST_7_DAYS".equalsIgnoreCase(fromDate)) {
            after = Instant.now().minus(7, ChronoUnit.DAYS);
        }

        List<PrintOrder> orders;
        if (status != null && !status.isBlank()) {
            orders = printOrderRepository.findByStatusAndCreatedAtAfter(status, after);
        } else {
            orders = printOrderRepository.findByCreatedAtAfter(after);
        }

        return orders.stream()
                .map(o -> new OrderDtos.VendorOrderListItem(
                        o.getId(),
                        o.getPickupCode(),
                        o.getStudentName(),
                        o.getStatus(),
                        o.getPaymentStatus(),
                        o.getAmount(),
                        o.getCreatedAt().toString()
                ))
                .toList();
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDtos.VendorOrderDetail> getOrder(@PathVariable Long orderId) {
        return printOrderRepository.findById(orderId)
                .map(o -> {
                    String fileUrl = fileBaseUrl + "/api/vendor/orders/" + o.getId() + "/file";
                    return ResponseEntity.ok(
                            new OrderDtos.VendorOrderDetail(
                                    o.getId(),
                                    o.getPickupCode(),
                                    o.getStudentName(),
                                    o.getStudentEmail(),
                                    o.getStudentPhone(),
                                    o.getCopies(),
                                    o.getColorMode(),
                                    o.getSides(),
                                    o.getPaperSize(),
                                    o.getSpecialInstructions(),
                                    o.getStatus(),
                                    o.getPaymentStatus(),
                                    o.getPaymentReference(),
                                    o.getAmount(),
                                    o.getCreatedAt().toString(),
                                    fileUrl
                            )
                    );
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private static final List<String> ALLOWED_STATUSES = List.of("PAID", "READY_FOR_PICKUP", "COMPLETED");

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        if (status == null || !ALLOWED_STATUSES.contains(status)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status. Allowed: " + ALLOWED_STATUSES));
        }
        return printOrderRepository.findById(orderId)
                .map(o -> {
                    o.setStatus(status);
                    printOrderRepository.save(o);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{orderId}/file")
    public ResponseEntity<byte[]> getFile(@PathVariable Long orderId) {
        return printOrderRepository.findById(orderId)
                .map(o -> {
                    try {
                        var path = Paths.get(o.getFilePath());
                        byte[] bytes = java.nio.file.Files.readAllBytes(path);
                        return ResponseEntity.ok()
                                .header("Content-Type", "application/pdf")
                                .header("Content-Disposition", "inline; filename=\"" + o.getFileName() + "\"")
                                .body(bytes);
                    } catch (Exception e) {
                        return ResponseEntity.internalServerError().<byte[]>build();
                    }
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}

