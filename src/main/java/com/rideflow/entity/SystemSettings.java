package com.rideflow.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "system_settings")
public class SystemSettings {

    @Id
    private String id = "default_settings";

    // Contact Information
    private String contactPhone = "+91 98765 43210";
    private String contactEmail = "support@rideflow.com";

    // Driver-Only Pricing & Commission (Hourly & Daily basis for customer-owned car)
    private double driverOnlyMinDailyPrice = 1200.0;        // Minimum 1-day booking price for driver (₹)
    private double driverOnlyBasePrice = 600.0;            // Base service fare (₹)
    private double driverOnlyIncludedHours = 4.0;          // Included duration in hours
    private double driverOnlyExtraHourRate = 100.0;        // Extra per-hour rate (₹/Hour)
    private double driverOnlyCommissionPercentage = 15.0;  // Platform commission on driver-only trips (%)

    // Backward compatibility fields for KM
    private double driverOnlyIncludedKm = 40.0;
    private double driverOnlyExtraKmPrice = 10.0;

    // Platform Vehicle Commission (default for rental cars if not overridden on vehicle)
    private double defaultVehicleCommissionPercentage = 10.0;

    private String updatedAt;

    public SystemSettings() {
    }

    public SystemSettings(String id, String contactPhone, String contactEmail, double driverOnlyMinDailyPrice,
                          double driverOnlyBasePrice, double driverOnlyIncludedHours, double driverOnlyExtraHourRate,
                          double driverOnlyCommissionPercentage, double defaultVehicleCommissionPercentage,
                          String updatedAt) {
        this.id = id != null ? id : "default_settings";
        this.contactPhone = contactPhone;
        this.contactEmail = contactEmail;
        this.driverOnlyMinDailyPrice = driverOnlyMinDailyPrice;
        this.driverOnlyBasePrice = driverOnlyBasePrice;
        this.driverOnlyIncludedHours = driverOnlyIncludedHours;
        this.driverOnlyExtraHourRate = driverOnlyExtraHourRate;
        this.driverOnlyCommissionPercentage = driverOnlyCommissionPercentage;
        this.defaultVehicleCommissionPercentage = defaultVehicleCommissionPercentage;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public double getDriverOnlyMinDailyPrice() {
        return driverOnlyMinDailyPrice;
    }

    public void setDriverOnlyMinDailyPrice(double driverOnlyMinDailyPrice) {
        this.driverOnlyMinDailyPrice = driverOnlyMinDailyPrice;
    }

    public double getDriverOnlyBasePrice() {
        return driverOnlyBasePrice;
    }

    public void setDriverOnlyBasePrice(double driverOnlyBasePrice) {
        this.driverOnlyBasePrice = driverOnlyBasePrice;
    }

    public double getDriverOnlyIncludedHours() {
        return driverOnlyIncludedHours;
    }

    public void setDriverOnlyIncludedHours(double driverOnlyIncludedHours) {
        this.driverOnlyIncludedHours = driverOnlyIncludedHours;
    }

    public double getDriverOnlyExtraHourRate() {
        return driverOnlyExtraHourRate;
    }

    public void setDriverOnlyExtraHourRate(double driverOnlyExtraHourRate) {
        this.driverOnlyExtraHourRate = driverOnlyExtraHourRate;
    }

    public double getDriverOnlyIncludedKm() {
        return driverOnlyIncludedKm;
    }

    public void setDriverOnlyIncludedKm(double driverOnlyIncludedKm) {
        this.driverOnlyIncludedKm = driverOnlyIncludedKm;
    }

    public double getDriverOnlyExtraKmPrice() {
        return driverOnlyExtraKmPrice;
    }

    public void setDriverOnlyExtraKmPrice(double driverOnlyExtraKmPrice) {
        this.driverOnlyExtraKmPrice = driverOnlyExtraKmPrice;
    }

    public double getDriverOnlyCommissionPercentage() {
        return driverOnlyCommissionPercentage;
    }

    public void setDriverOnlyCommissionPercentage(double driverOnlyCommissionPercentage) {
        this.driverOnlyCommissionPercentage = driverOnlyCommissionPercentage;
    }

    public double getDefaultVehicleCommissionPercentage() {
        return defaultVehicleCommissionPercentage;
    }

    public void setDefaultVehicleCommissionPercentage(double defaultVehicleCommissionPercentage) {
        this.defaultVehicleCommissionPercentage = defaultVehicleCommissionPercentage;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
