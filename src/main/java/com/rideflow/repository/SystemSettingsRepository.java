package com.rideflow.repository;

import com.rideflow.entity.SystemSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemSettingsRepository extends MongoRepository<SystemSettings, String> {
}
