package com.arcade.repository;

import com.arcade.model.VendorUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorUserRepository extends JpaRepository<VendorUser, Long> {

    Optional<VendorUser> findByUsername(String username);
}

