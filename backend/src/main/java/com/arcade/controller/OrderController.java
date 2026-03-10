package com.arcade.controller;

import com.arcade.dto.OrderDtos;
import com.arcade.model.PrintOrder;
import com.arcade.model.Student;
import com.arcade.repository.PrintOrderRepository;
import com.arcade.repository.StudentRepository;
import com.arcade.security.JwtService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final PrintOrderRepository printOrderRepository;
    private final StudentRepository studentRepository;
    private final JwtService jwtService;

    @Value("${arcade.upload-dir}")
    private String uploadDir;

    public OrderController(PrintOrderRepository printOrderRepository, 
                          StudentRepository studentRepository,
                          JwtService jwtService) {
        this.printOrderRepository = printOrderRepository;
        this.studentRepository = studentRepository;
        this.jwtService = jwtService;
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
        try {
            System.out.println("Received order creation request");
            
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "File is required"));
            }
            
            if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
                System.err.println("Invalid file type: " + file.getContentType());
                return ResponseEntity.badRequest().body(Map.of("message", "Only PDF files are allowed"));
            }

            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String storedFileName = UUID.randomUUID() + "-" + originalFilename;
            Path target = uploadPath.resolve(storedFileName);
            Files.copy(file.getInputStream(), target);

            BigDecimal amount = calculateAmount(pages, copies, colorMode, sides);

            PrintOrder order = new PrintOrder();
            order.setPickupCode(generatePickupCode());
            order.setFilePath(target.toString());
            order.setFileName(originalFilename);
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
                } catch (Exception e) {
                    System.err.println("Error linking student: " + e.getMessage());
                }
            }

            PrintOrder saved = printOrderRepository.save(order);
            System.out.println("Order saved with ID: " + saved.getId());

            OrderDtos.CreateOrderResponse response =
                    new OrderDtos.CreateOrderResponse(saved.getId(), saved.getPickupCode(), amount);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            System.err.println("Error uploading file: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to upload file"));
        } catch (Exception e) {
            System.err.println("Error creating order: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to create order: " + e.getMessage()));
        }
    }

    @PostMapping("/{orderId}/confirm-payment")
    @Transactional
    public ResponseEntity<Void> confirmPayment(
            @PathVariable Long orderId,
            @RequestBody OrderDtos.ConfirmPaymentRequest request
    ) {
        Optional<PrintOrder> optionalOrder = printOrderRepository.findById(orderId);
        if (optionalOrder.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        PrintOrder order = optionalOrder.get();
        if ("SUCCESS".equalsIgnoreCase(request.paymentStatus())) {
            order.setPaymentStatus("SUCCESS");
            order.setStatus("PAID");
            order.setPaymentReference(request.paymentReference());
        } else {
            order.setPaymentStatus(request.paymentStatus());
        }
        printOrderRepository.save(order);
        return ResponseEntity.ok().build();
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
        double pricePerPage;
        if ("COLOR".equalsIgnoreCase(colorMode)) {
            pricePerPage = 10.0;
        } else {
            pricePerPage = "DOUBLE".equalsIgnoreCase(sides) ? 1.5 : 1.2;
        }
        return BigDecimal.valueOf(pricePerPage * Math.max(pages, 1) * Math.max(copies, 1));
    }

    private String generatePickupCode() {
        return UUID.randomUUID().toString().replaceAll("-", "").substring(0, 8).toUpperCase();
    }
}

