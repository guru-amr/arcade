package com.arcade.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "print_orders", indexes = {
    @Index(name = "idx_pickup_code", columnList = "pickupCode"),
    @Index(name = "idx_student_email", columnList = "studentEmail"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_created_at", columnList = "createdAt"),
    @Index(name = "idx_payment_status", columnList = "paymentStatus"),
    @Index(name = "idx_status_created", columnList = "status, createdAt")
})
@Getter
@Setter
public class PrintOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 16)
    private String pickupCode;

    @Column(nullable = false)
    private String filePath;

    @Column(nullable = false)
    private String fileName;

    private int copies;

    @Column(nullable = false, length = 20)
    private String colorMode; // BLACK_WHITE, COLOR

    @Column(nullable = false, length = 20)
    private String sides; // SINGLE, DOUBLE

    @Column(nullable = false, length = 20)
    private String paperSize;

    @Column(columnDefinition = "TEXT")
    private String specialInstructions;

    @Column(nullable = false)
    private String studentName;

    @Column(nullable = false)
    private String studentEmail;

    @Column(nullable = false)
    private String studentPhone;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(nullable = false, length = 32)
    private String status; // NEW, PAID, READY_FOR_PICKUP, COMPLETED

    @Column(nullable = false, length = 32)
    private String paymentStatus; // PENDING, SUCCESS, FAILED

    private String paymentReference;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}

