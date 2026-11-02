package com.rideflow.controller;

import com.rideflow.entity.Booking;
import com.rideflow.entity.CommissionPayment;
import com.rideflow.entity.User;
import com.rideflow.repository.BookingRepository;
import com.rideflow.repository.CommissionPaymentRepository;
import com.rideflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/commissions")
public class CommissionController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CommissionPaymentRepository commissionPaymentRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<?> getDriverCommission(
            @PathVariable String driverId,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String email) {

        Set<String> driverIds = new HashSet<>();
        Set<String> driverPhones = new HashSet<>();

        if (driverId != null && !driverId.trim().isEmpty()) {
            driverIds.add(driverId.trim());
            Optional<User> uOpt = userRepository.findById(driverId.trim());
            if (uOpt.isPresent() && uOpt.get().getPhone() != null) {
                driverPhones.add(uOpt.get().getPhone().replaceAll("[^0-9]", ""));
            }
        }

        if (phone != null && !phone.trim().isEmpty()) {
            String cleanPhone = phone.replaceAll("[^0-9]", "");
            if (!cleanPhone.isEmpty()) {
                driverPhones.add(cleanPhone);
                List<User> driversWithPhone = userRepository.findByPhone(cleanPhone);
                for (User d : driversWithPhone) {
                    if (d.getId() != null) driverIds.add(d.getId());
                }
            }
        }

        if (email != null && !email.trim().isEmpty()) {
            Optional<User> uByEmail = userRepository.findByUserEmail(email.trim().toLowerCase());
            if (uByEmail.isPresent()) {
                if (uByEmail.get().getId() != null) driverIds.add(uByEmail.get().getId());
                if (uByEmail.get().getPhone() != null) {
                    driverPhones.add(uByEmail.get().getPhone().replaceAll("[^0-9]", ""));
                }
            }
        }

        List<Booking> all = bookingRepository.findAllByOrderByIdDesc();
        List<Booking> allDriverBookings = all.stream().filter(b -> {
            boolean idMatch = b.getDriverId() != null && driverIds.contains(b.getDriverId());
            boolean phoneMatch = b.getDriverPhone() != null && !driverPhones.isEmpty() &&
                    driverPhones.contains(b.getDriverPhone().replaceAll("[^0-9]", ""));
            return idMatch || phoneMatch;
        }).collect(Collectors.toList());

        List<Booking> completedRides = allDriverBookings.stream()
                .filter(b -> "COMPLETED".equalsIgnoreCase(b.getStatus()))
                .collect(Collectors.toList());

        double totalEarnings = 0.0;
        double totalCommission = 0.0;
        double driverOnlyCommission = 0.0;
        double vehicleCommission = 0.0;
        double paidCommission = 0.0;
        double pendingCommission = 0.0;

        for (Booking b : completedRides) {
            totalEarnings += b.getDriverEarnings();
            totalCommission += b.getCommissionAmount();
            boolean isDO = "ONLY_DRIVER".equalsIgnoreCase(b.getVehicleOption()) ||
                    "DRIVER_ONLY".equalsIgnoreCase(b.getVehicleOption());
            if (isDO) {
                driverOnlyCommission += b.getCommissionAmount();
            } else {
                vehicleCommission += b.getCommissionAmount();
            }
            paidCommission += b.getCommissionPaid();
            pendingCommission += b.getCommissionRemaining();
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalEarnings", Math.round(totalEarnings * 100.0) / 100.0);
        summary.put("totalCommission", Math.round(totalCommission * 100.0) / 100.0);
        summary.put("driverOnlyCommission", Math.round(driverOnlyCommission * 100.0) / 100.0);
        summary.put("vehicleCommission", Math.round(vehicleCommission * 100.0) / 100.0);
        summary.put("paidCommission", Math.round(paidCommission * 100.0) / 100.0);
        summary.put("pendingCommission", Math.round(pendingCommission * 100.0) / 100.0);

        Map<String, Object> response = new HashMap<>();
        response.put("summary", summary);
        response.put("rides", completedRides);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllCommissions() {
        List<Booking> all = bookingRepository.findAllByOrderByIdDesc();
        List<Booking> completed = all.stream()
                .filter(b -> "COMPLETED".equalsIgnoreCase(b.getStatus()))
                .collect(Collectors.toList());

        double totalCommission = 0.0;
        double driverOnlyCommission = 0.0;
        double vehicleCommission = 0.0;
        double paidCommission = 0.0;
        double pendingCommission = 0.0;
        double totalFare = 0.0;

        // Group by driver
        Map<String, List<Booking>> driverBookingsMap = new HashMap<>();
        for (Booking b : completed) {
            totalFare += b.getFare();
            totalCommission += b.getCommissionAmount();
            boolean isDO = "ONLY_DRIVER".equalsIgnoreCase(b.getVehicleOption()) ||
                    "DRIVER_ONLY".equalsIgnoreCase(b.getVehicleOption());
            if (isDO) {
                driverOnlyCommission += b.getCommissionAmount();
            } else {
                vehicleCommission += b.getCommissionAmount();
            }
            paidCommission += b.getCommissionPaid();
            pendingCommission += b.getCommissionRemaining();

            String dId = b.getDriverId() != null ? b.getDriverId() : "unassigned";
            driverBookingsMap.computeIfAbsent(dId, k -> new ArrayList<>()).add(b);
        }

        List<Map<String, Object>> driverStats = new ArrayList<>();
        for (Map.Entry<String, List<Booking>> entry : driverBookingsMap.entrySet()) {
            String dId = entry.getKey();
            List<Booking> rides = entry.getValue();
            String driverName = rides.get(0).getDriverName() != null ? rides.get(0).getDriverName() : "Driver";

            double dFare = 0.0;
            double dComm = 0.0;
            double dDriverOnlyComm = 0.0;
            double dVehComm = 0.0;
            int dDriverOnlyRides = 0;
            int dVehicleRides = 0;
            double dPaid = 0.0;
            double dRem = 0.0;

            for (Booking r : rides) {
                dFare += r.getFare();
                dComm += r.getCommissionAmount();
                boolean isDO = "ONLY_DRIVER".equalsIgnoreCase(r.getVehicleOption()) ||
                        "DRIVER_ONLY".equalsIgnoreCase(r.getVehicleOption());
                if (isDO) {
                    dDriverOnlyComm += r.getCommissionAmount();
                    dDriverOnlyRides++;
                } else {
                    dVehComm += r.getCommissionAmount();
                    dVehicleRides++;
                }
                dPaid += r.getCommissionPaid();
                dRem += r.getCommissionRemaining();
            }

            String status = "PENDING";
            if (dRem <= 0.001) {
                status = "PAID";
            } else if (dPaid > 0) {
                status = "PARTIALLY PAID";
            }

            Map<String, Object> stat = new HashMap<>();
            stat.put("driverId", dId);
            stat.put("driverName", driverName);
            stat.put("completedRides", rides.size());
            stat.put("driverOnlyRides", dDriverOnlyRides);
            stat.put("vehicleRides", dVehicleRides);
            stat.put("totalFare", Math.round(dFare * 100.0) / 100.0);
            stat.put("totalCommission", Math.round(dComm * 100.0) / 100.0);
            stat.put("driverOnlyCommission", Math.round(dDriverOnlyComm * 100.0) / 100.0);
            stat.put("vehicleCommission", Math.round(dVehComm * 100.0) / 100.0);
            stat.put("paidCommission", Math.round(dPaid * 100.0) / 100.0);
            stat.put("remainingCommission", Math.round(dRem * 100.0) / 100.0);
            stat.put("status", status);

            driverStats.add(stat);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalFare", Math.round(totalFare * 100.0) / 100.0);
        summary.put("totalCommission", Math.round(totalCommission * 100.0) / 100.0);
        summary.put("driverOnlyCommission", Math.round(driverOnlyCommission * 100.0) / 100.0);
        summary.put("vehicleCommission", Math.round(vehicleCommission * 100.0) / 100.0);
        summary.put("paidCommission", Math.round(paidCommission * 100.0) / 100.0);
        summary.put("pendingCommission", Math.round(pendingCommission * 100.0) / 100.0);

        Map<String, Object> response = new HashMap<>();
        response.put("summary", summary);
        response.put("driverStats", driverStats);
        response.put("bookings", completed);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment")
    public ResponseEntity<?> recordCommissionPayment(@RequestBody Map<String, Object> request) {
        if (request == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Request body is missing"));
        }

        String bookingId = request.get("bookingId") != null ? String.valueOf(request.get("bookingId")).trim() : "";
        String driverId = request.get("driverId") != null ? String.valueOf(request.get("driverId")).trim() : "";
        String note = request.get("note") != null ? String.valueOf(request.get("note")).trim() : "";
        String paymentDate = request.get("paymentDate") != null ? String.valueOf(request.get("paymentDate")).trim() :
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        if (bookingId.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Booking ID is required"));
        }

        double paymentAmount = 0.0;
        try {
            paymentAmount = Double.parseDouble(String.valueOf(request.get("paymentAmount")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid payment amount"));
        }

        if (paymentAmount <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Payment amount must be greater than 0"));
        }

        // Find booking
        Optional<Booking> opt = bookingRepository.findByBookingId(bookingId);
        if (opt.isEmpty()) {
            opt = bookingRepository.findById(bookingId);
        }

        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Booking not found with ID: " + bookingId));
        }

        Booking booking = opt.get();

        if (paymentAmount > booking.getCommissionRemaining()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Payment amount cannot exceed remaining commission of ₹" + booking.getCommissionRemaining()));
        }

        double updatedPaid = Math.round((booking.getCommissionPaid() + paymentAmount) * 100.0) / 100.0;
        double updatedRemaining = Math.round(Math.max(0.0, booking.getCommissionRemaining() - paymentAmount) * 100.0) / 100.0;

        String updatedStatus = "PENDING";
        if (updatedRemaining <= 0.001) {
            updatedStatus = "PAID";
        } else if (updatedPaid > 0) {
            updatedStatus = "PARTIALLY PAID";
        }

        booking.setCommissionPaid(updatedPaid);
        booking.setCommissionRemaining(updatedRemaining);
        booking.setCommissionStatus(updatedStatus);
        Booking savedBooking = bookingRepository.save(booking);

        // Record payment in CommissionPayment collection
        String driverName = booking.getDriverName() != null ? booking.getDriverName() : "Driver";
        String effectiveDriverId = driverId.isEmpty() ? booking.getDriverId() : driverId;

        CommissionPayment record = new CommissionPayment(
                effectiveDriverId,
                driverName,
                booking.getBookingId(),
                booking.getId(),
                paymentAmount,
                paymentDate,
                note
        );
        CommissionPayment savedPayment = commissionPaymentRepository.save(record);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Commission payment recorded successfully");
        response.put("booking", savedBooking);
        response.put("payment", savedPayment);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/payments")
    public ResponseEntity<List<CommissionPayment>> getPaymentHistory(
            @RequestParam(required = false) String driverId,
            @RequestParam(required = false) String bookingId) {

        if (driverId != null && !driverId.trim().isEmpty()) {
            return ResponseEntity.ok(commissionPaymentRepository.findByDriverId(driverId.trim()));
        }
        if (bookingId != null && !bookingId.trim().isEmpty()) {
            return ResponseEntity.ok(commissionPaymentRepository.findByBookingId(bookingId.trim()));
        }
        return ResponseEntity.ok(commissionPaymentRepository.findAllByOrderByIdDesc());
    }
}
