package com.arcade.controller;

import com.arcade.model.PrintOrder;
import com.arcade.repository.PrintOrderRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments/razorpay")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PrintOrderRepository printOrderRepository;

    @Value("${arcade.razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${arcade.razorpay.key-secret:}")
    private String razorpayKeySecret;

    public PaymentController(PrintOrderRepository printOrderRepository) {
        this.printOrderRepository = printOrderRepository;
    }

    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createRazorpayOrder(@RequestBody Map<String, Object> body) {
        if (!StringUtils.hasText(razorpayKeyId) || !StringUtils.hasText(razorpayKeySecret)) {
            return ResponseEntity.status(501).body(Map.of("error", "Razorpay is not configured"));
        }
        Object orderIdObj = body.get("orderId");
        if (orderIdObj == null) return ResponseEntity.badRequest().build();

        Long orderId = ((Number) orderIdObj).longValue();
        Optional<PrintOrder> optionalOrder = printOrderRepository.findById(orderId);
        if (optionalOrder.isEmpty()) return ResponseEntity.notFound().build();

        PrintOrder order = optionalOrder.get();
        long amountPaise = order.getAmount().multiply(java.math.BigDecimal.valueOf(100)).longValue();

        // Minimal implementation: use Razorpay "order_id" as a deterministic value in dev.
        // For production, replace this with a real call to Razorpay Orders API.
        String razorpayOrderId = "order_" + order.getId();

        return ResponseEntity.ok(Map.of(
                "razorpayOrderId", razorpayOrderId,
                "amountPaise", amountPaise,
                "currency", "INR"
        ));
    }

    @PostMapping("/verify")
    @Transactional
    public ResponseEntity<?> verify(@RequestBody Map<String, Object> body) {
        if (!StringUtils.hasText(razorpayKeySecret)) {
            return ResponseEntity.status(501).body(Map.of("error", "Razorpay is not configured"));
        }

        Long orderId = ((Number) body.get("orderId")).longValue();
        String razorpayOrderId = (String) body.get("razorpayOrderId");
        String razorpayPaymentId = (String) body.get("razorpayPaymentId");
        String razorpaySignature = (String) body.get("razorpaySignature");

        Optional<PrintOrder> optionalOrder = printOrderRepository.findById(orderId);
        if (optionalOrder.isEmpty()) return ResponseEntity.notFound().build();

        // Signature check: HMAC_SHA256(order_id|payment_id, secret)
        String payload = razorpayOrderId + "|" + razorpayPaymentId;
        String computed = hmacSha256Hex(payload, razorpayKeySecret);
        if (!computed.equals(razorpaySignature)) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid signature"));
        }

        PrintOrder order = optionalOrder.get();
        order.setPaymentStatus("SUCCESS");
        order.setStatus("PAID");
        order.setPaymentReference(razorpayPaymentId);
        printOrderRepository.save(order);

        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    private static String hmacSha256Hex(String data, String secret) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}

