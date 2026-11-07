package com.rideflow.repository;

import com.rideflow.entity.CommissionPayment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommissionPaymentRepository extends MongoRepository<CommissionPayment, String> {
    List<CommissionPayment> findByDriverId(String driverId);
    List<CommissionPayment> findByBookingId(String bookingId);
    List<CommissionPayment> findAllByOrderByIdDesc();
}
