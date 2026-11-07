package com.rideflow.repository;

import com.rideflow.entity.SupportRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportRequestRepository extends MongoRepository<SupportRequest, String> {
    List<SupportRequest> findAllByOrderByCreatedAtDesc();
    List<SupportRequest> findByUserIdOrderByCreatedAtDesc(String userId);
}
