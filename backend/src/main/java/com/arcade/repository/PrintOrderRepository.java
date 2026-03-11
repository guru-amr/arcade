package com.arcade.repository;

import com.arcade.model.PrintOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface PrintOrderRepository extends JpaRepository<PrintOrder, Long> {

    List<PrintOrder> findByStatusAndCreatedAtAfter(String status, Instant after);

    List<PrintOrder> findByCreatedAtAfter(Instant after);

    Page<PrintOrder> findByStudentEmailOrderByCreatedAtDesc(String email, Pageable pageable);
    
    List<PrintOrder> findByStudentEmailOrderByCreatedAtDesc(String email);
}

