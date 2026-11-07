package com.rideflow.repository;

import com.rideflow.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUserEmail(String userEmail);
    List<User> findByRole(String role);
    List<User> findByRoleAndAvailable(String role, boolean available);
    List<User> findByPhone(String phone);
}
