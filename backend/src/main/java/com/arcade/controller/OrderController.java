package com.arcade.controller;

import com.arcade.dto.OrderDtos;
import com.arcade.model.PrintOrder;
import com.arcade.model.Student;
import com.arcade.repository.PrintOrderRepository;
import com.arcade.repository.StudentRepository;
import com.arcade.security.JwtService;
import com.arcade.service.FileStorageService;
import jakarta.transaction.Transactional;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final PrintOrderRepository printOrderRepository;
    private final StudentRepository studentRepository;
    private final JwtService jwtService;
    private final FileStorageService fileStorageService;

    public OrderController(PrintOrderRepository printOrderRepository,
                           StudentRepository studentRepository,
                           JwtService jwtService,
                           FileStorageService fileStorageService) {
        this.printOrderRepository = printOrderRepository;
        this.studentRepository = studentRepository;
        this.jwtService = jwtService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(path = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> createOrder(
            @RequestParam("file") MultipartFile file,
            @RequestParam("pages") int pages,
            @RequestParam("copies") int copies,
            @RequestParam("colorMode") String colorMode,
            @RequestParam("sides") String sides,
            @RequestParam("paperSize") String paperSize,
            @RequestParam(value = "specialInstructions", required = false) String specialInstructions,
            @RequestParam("studentName") String studentName,
            @RequestParam("studentEmail") String studentEmail,
            @RequestParam("studentPhone") String studentPhone,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is required"));
        }
        if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only PDF files are allowed"));
        }

        try {
            String filePath = fileStorageService.storeFile(file);
            BigDecimal amount = calculateAmount(pages, copies, colorMode, sides);

            PrintOrder order = new PrintOrder();
            order.setPickupCode(generatePickupCode());
            order.setFilePath(filePath);
            order.setFileName(file.getOriginalFilename());
            order.setCopies(copies);
            order.setColorMode(colorMode);
            order.setSides(sides);
            order.setPaperSize(paperSize);
            order.setSpecialInstructions(specialInstructions);
            order.setStudentName(studentName);
            order.setStudentEmail(studentEmail);
            order.setStudentPhone(studentPhone);
            order.setStatus("NEW");
            order.setPaymentStatus("PENDING");
            order.setAmount(amount);

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    String token = authHeader.substring(7);
                    String email = jwtService.extractUsername(token);
                    studentRepository.findByEmail(email).ifPresent(order::setStudent);
                } catch (Exception ignored) {}
            }

            PrintOrder saved = printOrderRepository.save(order);
            return ResponseEntity.ok(new OrderDtos.CreateOrderResponse(saved.getId(), saved.getPickupCode(), amount));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to create order: " + e.getMessage()));
        }
    }

    @PostMapping("/{orderId}/confirm-payment")
    @Transactional
    public ResponseEntity<Void> confirmPayment(
            @PathVariable Long orderId,
            @RequestBody OrderDtos.ConfirmPaymentRequest request
    ) {
        return printOrderRepository.findById(orderId).map(order -> {
            if ("SUCCESS".equalsIgnoreCase(request.paymentStatus())) {
                order.setPaymentStatus("SUCCESS");
                order.setStatus("PAID");
                order.setPaymentReference(request.paymentReference());
            } else {
                order.setPaymentStatus(request.paymentStatus());
            }
            printOrderRepository.save(order);
            return ResponseEntity.ok().<Void>build();
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDtos.PublicOrderSummary> getOrder(@PathVariable Long orderId) {
        return printOrderRepository.findById(orderId)
                .map(order -> ResponseEntity.ok(
                        new OrderDtos.PublicOrderSummary(
                                order.getId(),
                                order.getPickupCode(),
                                order.getFileName(),
                                order.getCopies(),
                                order.getColorMode(),
                                order.getSides(),
                                order.getPaperSize(),
                                order.getSpecialInstructions(),
                                order.getAmount(),
                                order.getPaymentStatus()
                        )
                ))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private BigDecimal calculateAmount(int pages, int copies, String colorMode, String sides) {
        double pricePerPage = "COLOR".equalsIgnoreCase(colorMode) ? 10.0
                : "DOUBLE".equalsIgnoreCase(sides) ? 1.5 : 1.2;
        return BigDecimal.valueOf(pricePerPage * Math.max(pages, 1) * Math.max(copies, 1));
    }

    private String generatePickupCode() {
        return UUID.randomUUID().toString().replaceAll("-", "").substring(0, 8).toUpperCase();
    }
}
