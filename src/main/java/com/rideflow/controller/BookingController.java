package com.rideflow.controller;

import com.rideflow.entity.Booking;
import com.rideflow.entity.SystemSettings;
import com.rideflow.entity.User;
import com.rideflow.entity.Vehicle;
import com.rideflow.repository.BookingRepository;
import com.rideflow.repository.SystemSettingsRepository;
import com.rideflow.repository.UserRepository;
import com.rideflow.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private SystemSettingsRepository settingsRepository;

    @Autowired
    private com.rideflow.service.EmailService emailService;

    private static final AtomicLong counter = new AtomicLong(1001);

    private synchronized String generateBookingId() {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = bookingRepository.count() + counter.getAndIncrement();
        return "RF" + dateStr + String.format("%04d", count % 10000);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createBooking(@RequestBody Booking booking) {
        if (booking.getUserPhone() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Customer phone number is required"));
        }

        String phoneDigits = booking.getUserPhone().replaceAll("[^0-9]", "");
        if (phoneDigits.length() != 10) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Customer phone number must contain exactly 10 digits"));
        }
        booking.setUserPhone(phoneDigits);

        if (booking.getPickup() == null || booking.getPickup().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Pickup location is required"));
        }

        if ("LOCAL".equalsIgnoreCase(booking.getRideType())) {
            if (booking.getDestination() == null || booking.getDestination().trim().isEmpty()) {
                booking.setDestination("Local City Travel");
            }
        } else {
            if (booking.getDestination() == null || booking.getDestination().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Destination is required for Outstation rides"));
            }
        }

        if (booking.getDate() == null || booking.getDate().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Date is required"));
        }

        if (booking.getTime() == null || booking.getTime().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Time is required"));
        }

        if (booking.getRideType() == null || booking.getRideType().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Ride type is required"));
        }

        if (booking.getVehicleOption() == null || booking.getVehicleOption().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Vehicle option is required"));
        }

        booking.setBookingId(generateBookingId());
        booking.setStatus("PENDING");
        // No initial fare or commission calculation
        booking.setFare(0.0);
        booking.setActualKm(0.0);
        booking.setActualHours(0.0);
        booking.setCommissionAmount(0.0);
        booking.setDriverEarnings(0.0);
        booking.setCommissionPaid(0.0);
        booking.setCommissionRemaining(0.0);
        booking.setCommissionStatus("PENDING");

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        booking.setCreatedAt(now);
        booking.setUpdatedAt(now);

        Booking saved = bookingRepository.save(booking);

        // Send booking confirmation email to customer
        try {
            if (emailService != null) {
                emailService.sendBookingConfirmationEmail(saved);
            }
        } catch (Exception ex) {
            // Do not block booking creation on email error
        }

        return ResponseEntity.ok(saved);
    }

    // Admin view: complete unmasked access
    @GetMapping("/all")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingRepository.findAllByOrderByIdDesc());
    }

    // Customer view: driver phone masked until driver accepts
    @GetMapping("/user/{email}")
    public ResponseEntity<List<Booking>> getBookingsByUser(@PathVariable String email) {
        List<Booking> list = bookingRepository.findByUserEmail(email.trim().toLowerCase());
        List<Booking> maskedList = list.stream().map(b -> {
            Booking copy = cloneBooking(b);
            if ("PENDING".equalsIgnoreCase(copy.getStatus()) || "ASSIGNED".equalsIgnoreCase(copy.getStatus())) {
                copy.setDriverPhone("Waiting for driver acceptance");
            }
            return copy;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(maskedList);
    }

    // Driver view: customer phone masked until driver accepts
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Booking>> getBookingsByDriver(
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
        List<Booking> matched = all.stream().filter(b -> {
            boolean idMatch = b.getDriverId() != null && driverIds.contains(b.getDriverId());
            boolean phoneMatch = b.getDriverPhone() != null && !driverPhones.isEmpty() &&
                    driverPhones.contains(b.getDriverPhone().replaceAll("[^0-9]", ""));
            return idMatch || phoneMatch;
        }).collect(Collectors.toList());

        List<Booking> maskedList = matched.stream().map(b -> {
            Booking copy = cloneBooking(b);
            if ("PENDING".equalsIgnoreCase(copy.getStatus()) || "ASSIGNED".equalsIgnoreCase(copy.getStatus())) {
                copy.setUserPhone("Locked until accepted");
            }
            return copy;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(maskedList);
    }

    private Booking cloneBooking(Booking b) {
        Booking copy = new Booking();
        copy.setId(b.getId());
        copy.setBookingId(b.getBookingId());
        copy.setUserId(b.getUserId());
        copy.setUserName(b.getUserName());
        copy.setUserEmail(b.getUserEmail());
        copy.setUserPhone(b.getUserPhone());
        copy.setPickup(b.getPickup());
        copy.setPickupLat(b.getPickupLat());
        copy.setPickupLng(b.getPickupLng());
        copy.setDestination(b.getDestination());
        copy.setDate(b.getDate());
        copy.setTime(b.getTime());
        copy.setRideType(b.getRideType());
        copy.setVehicleOption(b.getVehicleOption());
        copy.setVehicleType(b.getVehicleType());
        copy.setVehicleId(b.getVehicleId());
        copy.setVehicleName(b.getVehicleName());
        copy.setVehicleImage(b.getVehicleImage());
        copy.setDriverId(b.getDriverId());
        copy.setDriverName(b.getDriverName());
        copy.setDriverPhone(b.getDriverPhone());
        copy.setStatus(b.getStatus());
        copy.setActualKm(b.getActualKm());
        copy.setActualHours(b.getActualHours());
        copy.setFare(b.getFare());
        copy.setCommissionPercentage(b.getCommissionPercentage());
        copy.setCommissionAmount(b.getCommissionAmount());
        copy.setDriverEarnings(b.getDriverEarnings());
        copy.setCommissionPaid(b.getCommissionPaid());
        copy.setCommissionRemaining(b.getCommissionRemaining());
        copy.setCommissionStatus(b.getCommissionStatus());
        copy.setCustomerCarName(b.getCustomerCarName());
        copy.setTransmission(b.getTransmission());
        copy.setDescription(b.getDescription());
        copy.setCreatedAt(b.getCreatedAt());
        copy.setUpdatedAt(b.getUpdatedAt());
        return copy;
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignDriver(@PathVariable String id, @RequestBody Map<String, String> request) {
        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Booking not found"));
        }

        String driverId = request.get("driverId");
        String driverName = request.get("driverName");
        String driverPhone = request.get("driverPhone");

        if (driverId == null || driverId.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Driver selection is required"));
        }

        if (driverPhone == null || driverPhone.trim().isEmpty()) {
            Optional<User> driverUser = userRepository.findById(driverId);
            if (driverUser.isPresent() && driverUser.get().getPhone() != null) {
                driverPhone = driverUser.get().getPhone();
            }
        }

        Booking booking = optionalBooking.get();
        booking.setDriverId(driverId);
        booking.setDriverName(driverName != null ? driverName : "Assigned Driver");
        booking.setDriverPhone(driverPhone);
        booking.setStatus("ASSIGNED");
        booking.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        Booking updated = bookingRepository.save(booking);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptBooking(@PathVariable String id, @RequestBody(required = false) Map<String, String> request) {
        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Booking not found"));
        }

        Booking booking = optionalBooking.get();
        booking.setStatus("ACCEPTED");
        booking.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        if (request != null && request.containsKey("driverPhone") && (booking.getDriverPhone() == null || booking.getDriverPhone().isEmpty())) {
            booking.setDriverPhone(request.get("driverPhone"));
        }

        Booking updated = bookingRepository.save(booking);

        // Driver becomes busy and load driver details for email
        User driverUser = null;
        if (booking.getDriverId() != null) {
            Optional<User> dOpt = userRepository.findById(booking.getDriverId());
            if (dOpt.isPresent()) {
                driverUser = dOpt.get();
                driverUser.setAvailable(false);
                userRepository.save(driverUser);
            }
        }

        // Send email notifications to both Customer and Driver
        try {
            if (emailService != null) {
                emailService.sendDriverAcceptedEmailToCustomer(updated, driverUser);
                emailService.sendRideAssignedEmailToDriver(updated, driverUser);
            }
        } catch (Exception ex) {
            // Keep booking intact even if mail service experiences temporary failure
        }

        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/reached")
    public ResponseEntity<?> driverReachedPickup(@PathVariable String id) {
        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Booking not found"));
        }

        Booking booking = optionalBooking.get();
        booking.setStatus("REACHED_PICKUP");
        booking.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        Booking updated = bookingRepository.save(booking);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/start")
    public ResponseEntity<?> startRide(@PathVariable String id) {
        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Booking not found"));
        }

        Booking booking = optionalBooking.get();
        booking.setStatus("STARTED");
        booking.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        Booking updated = bookingRepository.save(booking);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeRide(@PathVariable String id, @RequestBody(required = false) Map<String, Object> request) {
        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Booking not found"));
        }

        Booking booking = optionalBooking.get();
        if ("COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "This booking is already completed"));
        }

        boolean isDriverOnly = "ONLY_DRIVER".equalsIgnoreCase(booking.getVehicleOption()) ||
                               "DRIVER_ONLY".equalsIgnoreCase(booking.getVehicleOption());

        // Load platform system settings
        SystemSettings settings = settingsRepository.findById("default_settings")
                .orElseGet(SystemSettings::new);

        double finalFare = 0.0;
        double commissionPercentage = 0.0;
        double actualKm = 0.0;
        double actualHours = 0.0;

        if (isDriverOnly) {
            // ONLY DRIVER: Hourly & Daily basis calculation
            Object hoursObj = (request != null && request.get("actualHours") != null)
                    ? request.get("actualHours")
                    : (request != null ? request.get("actualKm") : null);

            if (hoursObj == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Actual service hours worked is required to complete Only Driver ride"));
            }

            try {
                actualHours = Double.parseDouble(String.valueOf(hoursObj));
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Invalid actual hours value"));
            }

            if (actualHours <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Actual hours worked must be greater than 0"));
            }

            double baseFare = settings.getDriverOnlyBasePrice() > 0 ? settings.getDriverOnlyBasePrice() : 600.0;
            double includedHours = settings.getDriverOnlyIncludedHours() > 0 ? settings.getDriverOnlyIncludedHours() : 4.0;
            double extraHourRate = settings.getDriverOnlyExtraHourRate() > 0 ? settings.getDriverOnlyExtraHourRate() : 100.0;
            double minDailyPrice = settings.getDriverOnlyMinDailyPrice() > 0 ? settings.getDriverOnlyMinDailyPrice() : 1200.0;
            commissionPercentage = settings.getDriverOnlyCommissionPercentage();

            finalFare = baseFare;
            if (actualHours > includedHours) {
                double extraHours = actualHours - includedHours;
                finalFare = baseFare + (extraHours * extraHourRate);
            }

            // Minimum 1-day booking price guarantee if duration >= 8 hours
            if (actualHours >= 8.0 && finalFare < minDailyPrice) {
                finalFare = minDailyPrice;
            }

            actualKm = 0.0;
        } else {
            // FLEET VEHICLE + DRIVER: KM basis calculation
            if (request == null || !request.containsKey("actualKm") || request.get("actualKm") == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Actual KM is required to calculate fare and complete ride"));
            }

            try {
                actualKm = Double.parseDouble(String.valueOf(request.get("actualKm")));
            } catch (Exception ex) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid actual KM number"));
            }

            if (actualKm <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Actual KM must be greater than 0"));
            }

            Vehicle vehicle = null;
            if (booking.getVehicleId() != null && !booking.getVehicleId().trim().isEmpty()) {
                Optional<Vehicle> vOpt = vehicleRepository.findById(booking.getVehicleId());
                if (vOpt.isPresent()) {
                    vehicle = vOpt.get();
                }
            }

            if (vehicle == null && booking.getVehicleType() != null) {
                List<Vehicle> list = vehicleRepository.findByType(booking.getVehicleType().toUpperCase());
                if (!list.isEmpty()) {
                    vehicle = list.get(0);
                }
            }

            double includedKm = vehicle != null ? vehicle.getIncludedKm() : 300.0;
            double basePrice = vehicle != null ? vehicle.getBasePrice() : 5000.0;
            double extraKmPrice = vehicle != null ? vehicle.getExtraKmPrice() : 15.0;
            commissionPercentage = (vehicle != null && vehicle.getCommissionPercentage() > 0)
                    ? vehicle.getCommissionPercentage()
                    : settings.getDefaultVehicleCommissionPercentage();

            finalFare = basePrice;
            if (actualKm > includedKm) {
                double extraKm = actualKm - includedKm;
                double extraCharge = extraKm * extraKmPrice;
                finalFare = basePrice + extraCharge;
            }

            actualHours = 0.0;
        }

        // Commission and driver earnings
        double commissionAmount = Math.round((finalFare * commissionPercentage / 100.0) * 100.0) / 100.0;
        double driverEarnings = Math.round((finalFare - commissionAmount) * 100.0) / 100.0;

        booking.setActualKm(actualKm);
        booking.setActualHours(actualHours);
        booking.setFare(finalFare);
        booking.setCommissionPercentage(commissionPercentage);
        booking.setCommissionAmount(commissionAmount);
        booking.setDriverEarnings(driverEarnings);
        booking.setCommissionPaid(0.0);
        booking.setCommissionRemaining(commissionAmount);
        booking.setCommissionStatus(commissionAmount > 0 ? "PENDING" : "PAID");

        booking.setStatus("COMPLETED");
        booking.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        Booking updated = bookingRepository.save(booking);

        // Driver becomes available again
        if (booking.getDriverId() != null) {
            Optional<User> driverUser = userRepository.findById(booking.getDriverId());
            driverUser.ifPresent(driver -> {
                driver.setAvailable(true);
                userRepository.save(driver);
            });
        }

        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable String id) {
        Optional<Booking> optionalBooking = bookingRepository.findById(id);
        if (optionalBooking.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Booking not found"));
        }

        Booking booking = optionalBooking.get();
        // Cancellation allowed only when PENDING or ASSIGNED
        if ("STARTED".equalsIgnoreCase(booking.getStatus()) || "COMPLETED".equalsIgnoreCase(booking.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Cannot cancel a ride that has already started or completed"));
        }

        booking.setStatus("CANCELLED");
        booking.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        Booking updated = bookingRepository.save(booking);

        // Reset driver availability if assigned
        if (booking.getDriverId() != null) {
            Optional<User> driverUser = userRepository.findById(booking.getDriverId());
            driverUser.ifPresent(driver -> {
                driver.setAvailable(true);
                userRepository.save(driver);
            });
        }

        return ResponseEntity.ok(updated);
    }
}
