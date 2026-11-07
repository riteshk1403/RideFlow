package com.rideflow.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "vehicles")
public class Vehicle {

    @Id
    private String id;
    private String name;
    private String type; // SEDAN, SUV, VINTAGE, LUXURY, TRAVELLER
    private String imageUrl;
    private int seats = 4;
    private boolean ac = true;

    // Pricing package configuration
    private double includedKm = 300.0;
    private double basePrice = 5000.0;
    private double extraKmPrice = 15.0;
    private double commissionPercentage = 10.0; // default 10%
    private Boolean available = true; // true = Available, false = Currently Unavailable

    public Vehicle() {
    }

    public Vehicle(String id, String name, String type, String imageUrl, int seats, boolean ac, double includedKm, double basePrice, double extraKmPrice, double commissionPercentage) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.imageUrl = imageUrl;
        this.seats = seats;
        this.ac = ac;
        this.includedKm = includedKm;
        this.basePrice = basePrice;
        this.extraKmPrice = extraKmPrice;
        this.commissionPercentage = commissionPercentage > 0 ? commissionPercentage : 10.0;
        this.available = true;
    }

    public Vehicle(String id, String name, String type, String imageUrl, int seats, boolean ac, double includedKm, double basePrice, double extraKmPrice, double commissionPercentage, Boolean available) {
        this(id, name, type, imageUrl, seats, ac, includedKm, basePrice, extraKmPrice, commissionPercentage);
        this.available = available != null ? available : true;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public int getSeats() {
        return seats;
    }

    public void setSeats(int seats) {
        this.seats = seats;
    }

    public boolean isAc() {
        return ac;
    }

    public void setAc(boolean ac) {
        this.ac = ac;
    }

    public double getIncludedKm() {
        return includedKm;
    }

    public void setIncludedKm(double includedKm) {
        this.includedKm = includedKm;
    }

    public double getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(double basePrice) {
        this.basePrice = basePrice;
    }

    public double getExtraKmPrice() {
        return extraKmPrice;
    }

    public void setExtraKmPrice(double extraKmPrice) {
        this.extraKmPrice = extraKmPrice;
    }

    public double getCommissionPercentage() {
        return commissionPercentage;
    }

    public void setCommissionPercentage(double commissionPercentage) {
        this.commissionPercentage = commissionPercentage;
    }

    public boolean isAvailable() {
        return available == null || available;
    }

    public Boolean getAvailable() {
        return isAvailable();
    }

    public void setAvailable(Boolean available) {
        this.available = available != null ? available : true;
    }
}
