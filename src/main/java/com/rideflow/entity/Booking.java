package com.rideflow.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;
    private String bookingId; // e.g. RF202610010001

    private String userId;
    private String userName;
    private String userEmail;
    private String userPhone;

    private String pickup;
    private Double pickupLat;
    private Double pickupLng;
    private String destination;

    private String date;
    private String time;

    private String rideType;      // LOCAL, OUTSTATION
    private String vehicleOption; // VEHICLE_ONLY, WITH_DRIVER
    private String vehicleType;   // SEDAN, SUV, VINTAGE, LUXURY, TRAVELLER
    private String vehicleId;
    private String vehicleName;
    private String vehicleImage;

    private String driverId;
    private String driverName;
    private String driverPhone;

    private String customerCarName;
    private String transmission; // MANUAL, AUTOMATIC
    private String description;

    // Statuses: PENDING, ASSIGNED, ACCEPTED, REACHED_PICKUP, STARTED, COMPLETED, CANCELLED
    private String status = "PENDING";

    // Completed ride calculations & commission
    private double actualKm = 0.0;
    private double actualHours = 0.0;
    private double fare = 0.0;
    private double commissionPercentage = 10.0;
    private double commissionAmount = 0.0;
    private double driverEarnings = 0.0;

    private double commissionPaid = 0.0;
    private double commissionRemaining = 0.0;
    private String commissionStatus = "PENDING"; // PENDING, PARTIALLY_PAID, PAID

    private String createdAt;
    private String updatedAt;

    public Booking() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserPhone() {
        return userPhone;
    }

    public void setUserPhone(String userPhone) {
        this.userPhone = userPhone;
    }

    public String getPickup() {
        return pickup;
    }

    public void setPickup(String pickup) {
        this.pickup = pickup;
    }

    public Double getPickupLat() {
        return pickupLat;
    }

    public void setPickupLat(Double pickupLat) {
        this.pickupLat = pickupLat;
    }

    public Double getPickupLng() {
        return pickupLng;
    }

    public void setPickupLng(Double pickupLng) {
        this.pickupLng = pickupLng;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getRideType() {
        return rideType;
    }

    public void setRideType(String rideType) {
        this.rideType = rideType;
    }

    public String getVehicleOption() {
        return vehicleOption;
    }

    public void setVehicleOption(String vehicleOption) {
        this.vehicleOption = vehicleOption;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(String vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
    }

    public String getVehicleImage() {
        return vehicleImage;
    }

    public void setVehicleImage(String vehicleImage) {
        this.vehicleImage = vehicleImage;
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverPhone() {
        return driverPhone;
    }

    public void setDriverPhone(String driverPhone) {
        this.driverPhone = driverPhone;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getActualKm() {
        return actualKm;
    }

    public void setActualKm(double actualKm) {
        this.actualKm = actualKm;
    }

    public double getFare() {
        return fare;
    }

    public void setFare(double fare) {
        this.fare = fare;
    }

    public double getCommissionPercentage() {
        return commissionPercentage;
    }

    public void setCommissionPercentage(double commissionPercentage) {
        this.commissionPercentage = commissionPercentage;
    }

    public double getCommissionAmount() {
        return commissionAmount;
    }

    public void setCommissionAmount(double commissionAmount) {
        this.commissionAmount = commissionAmount;
    }

    public double getDriverEarnings() {
        return driverEarnings;
    }

    public void setDriverEarnings(double driverEarnings) {
        this.driverEarnings = driverEarnings;
    }

    public double getCommissionPaid() {
        return commissionPaid;
    }

    public void setCommissionPaid(double commissionPaid) {
        this.commissionPaid = commissionPaid;
    }

    public double getCommissionRemaining() {
        return commissionRemaining;
    }

    public void setCommissionRemaining(double commissionRemaining) {
        this.commissionRemaining = commissionRemaining;
    }

    public String getCommissionStatus() {
        return commissionStatus;
    }

    public void setCommissionStatus(String commissionStatus) {
        this.commissionStatus = commissionStatus;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCustomerCarName() {
        return customerCarName;
    }

    public void setCustomerCarName(String customerCarName) {
        this.customerCarName = customerCarName;
    }

    public String getTransmission() {
        return transmission;
    }

    public void setTransmission(String transmission) {
        this.transmission = transmission;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getActualHours() {
        return actualHours;
    }

    public void setActualHours(double actualHours) {
        this.actualHours = actualHours;
    }
}
