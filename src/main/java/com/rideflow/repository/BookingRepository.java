package com.rideflow.repository;

import com.rideflow.entity.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    Optional<Booking> findByBookingId(String bookingId);
    List<Booking> findByUserEmail(String userEmail);
    List<Booking> findByDriverId(String driverId);
    List<Booking> findAllByOrderByIdDesc();
}
