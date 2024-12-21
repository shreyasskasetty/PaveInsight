package com.tti.paveinsight.repositories;

import com.tti.paveinsight.models.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    long countByStatus(String status);
    boolean existsByRequestIdAndResultFinalized(UUID requestId, boolean resultFinalized);
}
