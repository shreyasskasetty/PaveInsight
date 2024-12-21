package com.tti.paveinsight.repositories;

import com.tti.paveinsight.models.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RequestRepository extends JpaRepository<Request, UUID> {
    
    // Method to get the total number of requests
    long count();

    // Method to get the total number of pending requests
    long countByStatus(String status);
}
