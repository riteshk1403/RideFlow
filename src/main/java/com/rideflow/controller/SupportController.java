package com.rideflow.controller;

import com.rideflow.entity.SupportRequest;
import com.rideflow.repository.SupportRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    @Autowired
    private SupportRequestRepository supportRequestRepository;

    @PostMapping("/create")
    public ResponseEntity<?> createSupportRequest(@RequestBody SupportRequest request) {
        if (request.getProblemType() == null || request.getProblemType().trim().isEmpty() ||
            request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Problem type and description are required"));
        }

        request.setStatus("OPEN");
        request.setCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        SupportRequest saved = supportRequestRepository.save(request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/all")
    public ResponseEntity<List<SupportRequest>> getAllSupportRequests() {
        return ResponseEntity.ok(supportRequestRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SupportRequest>> getSupportRequestsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(supportRequestRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateSupportStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        Optional<SupportRequest> optional = supportRequestRepository.findById(id);
        if (optional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Support request not found"));
        }

        String newStatus = payload.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Status is required"));
        }

        SupportRequest req = optional.get();
        req.setStatus(newStatus.toUpperCase());
        SupportRequest updated = supportRequestRepository.save(req);
        return ResponseEntity.ok(updated);
    }
}
