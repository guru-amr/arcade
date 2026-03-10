package com.arcade.controller;

import com.arcade.dto.OrderDtos;
import com.arcade.model.PrintOrder;
import com.arcade.repository.PrintOrderRepository;
import com.arcade.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/orders")
@CrossOrigin(origins = "*")
public class StudentOrderController {

    private final PrintOrderRepository printOrderRepository;
    private final JwtService jwtService;

    public StudentOrderController(PrintOrderRepository printOrderRepository, JwtService jwtService) {
        this.printOrderRepository = printOrderRepository;
        this.jwtService = jwtService;
    }

    @GetMapping
    public ResponseEntity<List<OrderDtos.StudentOrderItem>> getMyOrders(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        
        String token = authHeader.substring(7);
        String email = jwtService.extractUsername(token);

        List<PrintOrder> orders = printOrderRepository.findByStudentEmailOrderByCreatedAtDesc(email);

        List<OrderDtos.StudentOrderItem> items = orders.stream()
                .map(o -> new OrderDtos.StudentOrderItem(
                        o.getId(),
                        o.getPickupCode(),
                        o.getFileName(),
                        o.getCopies(),
                        o.getStatus(),
                        o.getPaymentStatus(),
                        o.getAmount(),
                        o.getCreatedAt().toString()
                ))
                .toList();

        return ResponseEntity.ok(items);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDtos.StudentOrderDetail> getOrderDetail(
            @PathVariable Long orderId,
            @RequestHeader("Authorization") String authHeader
    ) {
        String token = authHeader.substring(7);
        String email = jwtService.extractUsername(token);

        return printOrderRepository.findById(orderId)
                .filter(o -> o.getStudentEmail().equals(email))
                .map(o -> ResponseEntity.ok(
                        new OrderDtos.StudentOrderDetail(
                                o.getId(),
                                o.getPickupCode(),
                                o.getFileName(),
                                o.getCopies(),
                                o.getColorMode(),
                                o.getSides(),
                                o.getPaperSize(),
                                o.getSpecialInstructions(),
                                o.getStatus(),
                                o.getPaymentStatus(),
                                o.getAmount(),
                                o.getCreatedAt().toString()
                        )
                ))
                .orElse(ResponseEntity.notFound().build());
    }
}
