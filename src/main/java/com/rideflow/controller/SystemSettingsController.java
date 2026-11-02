package com.rideflow.controller;

import com.rideflow.entity.SystemSettings;
import com.rideflow.repository.SystemSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/settings")
public class SystemSettingsController {

    @Autowired
    private SystemSettingsRepository settingsRepository;

    @GetMapping
    public ResponseEntity<SystemSettings> getSettings() {
        SystemSettings settings = settingsRepository.findById("default_settings")
                .orElseGet(() -> {
                    SystemSettings initial = new SystemSettings();
                    initial.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
                    return settingsRepository.save(initial);
                });
        return ResponseEntity.ok(settings);
    }

    @PutMapping
    public ResponseEntity<SystemSettings> updateSettings(@RequestBody SystemSettings newSettings) {
        SystemSettings settings = settingsRepository.findById("default_settings")
                .orElseGet(() -> new SystemSettings());

        if (newSettings.getContactPhone() != null && !newSettings.getContactPhone().trim().isEmpty()) {
            settings.setContactPhone(newSettings.getContactPhone().trim());
        }
        if (newSettings.getContactEmail() != null && !newSettings.getContactEmail().trim().isEmpty()) {
            settings.setContactEmail(newSettings.getContactEmail().trim().toLowerCase());
        }
        if (newSettings.getDriverOnlyMinDailyPrice() >= 0) {
            settings.setDriverOnlyMinDailyPrice(newSettings.getDriverOnlyMinDailyPrice());
        }
        if (newSettings.getDriverOnlyBasePrice() >= 0) {
            settings.setDriverOnlyBasePrice(newSettings.getDriverOnlyBasePrice());
        }
        if (newSettings.getDriverOnlyIncludedHours() >= 0) {
            settings.setDriverOnlyIncludedHours(newSettings.getDriverOnlyIncludedHours());
        }
        if (newSettings.getDriverOnlyExtraHourRate() >= 0) {
            settings.setDriverOnlyExtraHourRate(newSettings.getDriverOnlyExtraHourRate());
        }
        if (newSettings.getDriverOnlyIncludedKm() >= 0) {
            settings.setDriverOnlyIncludedKm(newSettings.getDriverOnlyIncludedKm());
        }
        if (newSettings.getDriverOnlyExtraKmPrice() >= 0) {
            settings.setDriverOnlyExtraKmPrice(newSettings.getDriverOnlyExtraKmPrice());
        }
        if (newSettings.getDriverOnlyCommissionPercentage() >= 0) {
            settings.setDriverOnlyCommissionPercentage(newSettings.getDriverOnlyCommissionPercentage());
        }
        if (newSettings.getDefaultVehicleCommissionPercentage() >= 0) {
            settings.setDefaultVehicleCommissionPercentage(newSettings.getDefaultVehicleCommissionPercentage());
        }

        settings.setUpdatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        SystemSettings saved = settingsRepository.save(settings);
        return ResponseEntity.ok(saved);
    }
}
