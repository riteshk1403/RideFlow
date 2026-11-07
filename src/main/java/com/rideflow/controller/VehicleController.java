package com.rideflow.controller;

import com.rideflow.entity.Vehicle;
import com.rideflow.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired
    private VehicleRepository vehicleRepository;

    @GetMapping
    public ResponseEntity<List<Vehicle>> getVehicles() {
        return ResponseEntity.ok(vehicleRepository.findAll());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleRepository.findAll());
    }

    @PostMapping("/add")
    public ResponseEntity<?> addVehicle(@RequestBody Vehicle vehicle) {
        if (vehicle.getName() == null || vehicle.getName().trim().isEmpty() ||
            vehicle.getType() == null || vehicle.getType().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Vehicle name and type are required"));
        }

        if (vehicle.getIncludedKm() < 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Included KM cannot be negative"));
        }
        if (vehicle.getBasePrice() < 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Base package price cannot be negative"));
        }
        if (vehicle.getExtraKmPrice() < 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Extra KM price cannot be negative"));
        }
        if (vehicle.getCommissionPercentage() < 0 || vehicle.getCommissionPercentage() > 100) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Commission percentage must be between 0 and 100"));
        }

        vehicle.setType(vehicle.getType().toUpperCase());
        if (vehicle.getImageUrl() == null || vehicle.getImageUrl().trim().isEmpty()) {
            vehicle.setImageUrl("https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80");
        }
        if (vehicle.getSeats() <= 0) {
            vehicle.setSeats(4);
        }

        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateVehicle(@PathVariable String id, @RequestBody Vehicle updatedVehicle) {
        Optional<Vehicle> optionalVehicle = vehicleRepository.findById(id);
        if (optionalVehicle.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Vehicle not found"));
        }

        if (updatedVehicle.getIncludedKm() < 0 || updatedVehicle.getBasePrice() < 0 || updatedVehicle.getExtraKmPrice() < 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Pricing values cannot be negative"));
        }

        Vehicle vehicle = optionalVehicle.get();
        if (updatedVehicle.getName() != null) vehicle.setName(updatedVehicle.getName().trim());
        if (updatedVehicle.getType() != null) vehicle.setType(updatedVehicle.getType().toUpperCase().trim());
        if (updatedVehicle.getImageUrl() != null) vehicle.setImageUrl(updatedVehicle.getImageUrl().trim());
        if (updatedVehicle.getSeats() > 0) vehicle.setSeats(updatedVehicle.getSeats());
        vehicle.setAc(updatedVehicle.isAc());

        if (updatedVehicle.getIncludedKm() >= 0) vehicle.setIncludedKm(updatedVehicle.getIncludedKm());
        if (updatedVehicle.getBasePrice() >= 0) vehicle.setBasePrice(updatedVehicle.getBasePrice());
        if (updatedVehicle.getExtraKmPrice() >= 0) vehicle.setExtraKmPrice(updatedVehicle.getExtraKmPrice());
        if (updatedVehicle.getCommissionPercentage() >= 0 && updatedVehicle.getCommissionPercentage() <= 100) {
            vehicle.setCommissionPercentage(updatedVehicle.getCommissionPercentage());
        }
        vehicle.setAvailable(updatedVehicle.isAvailable());

        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/toggle-availability")
    public ResponseEntity<?> toggleAvailability(@PathVariable String id) {
        Optional<Vehicle> optionalVehicle = vehicleRepository.findById(id);
        if (optionalVehicle.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Vehicle not found"));
        }
        Vehicle vehicle = optionalVehicle.get();
        vehicle.setAvailable(!vehicle.isAvailable());
        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/availability")
    public ResponseEntity<?> setAvailability(@PathVariable String id, @RequestBody Map<String, Boolean> body) {
        Optional<Vehicle> optionalVehicle = vehicleRepository.findById(id);
        if (optionalVehicle.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Vehicle not found"));
        }
        Vehicle vehicle = optionalVehicle.get();
        Boolean avail = body.get("available");
        vehicle.setAvailable(avail != null ? avail : true);
        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable String id) {
        if (!vehicleRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Vehicle not found"));
        }

        vehicleRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Vehicle deleted successfully"));
    }
}
