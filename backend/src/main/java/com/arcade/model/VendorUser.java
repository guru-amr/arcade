package com.arcade.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "vendor_users", indexes = {
    @Index(name = "idx_username", columnList = "username")
})
@Getter
@Setter
public class VendorUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 32)
    private String role; // ADMIN, VENDOR

    @CreationTimestamp
    private Instant createdAt;
}

