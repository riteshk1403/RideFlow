package com.rideflow.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "commission_payments")
public class CommissionPayment {

    @Id
    private String id;

    private String driverId;
    private String driverName;

    private String bookingId;
    private String commissionId;

    private double paymentAmount;
    private String paymentDate;
    private String note;

    private String createdAt;

    public CommissionPayment() {
    }

    public CommissionPayment(String driverId, String driverName, String bookingId, String commissionId, double paymentAmount, String paymentDate, String note) {
        this.driverId = driverId;
        this.driverName = driverName;
        this.bookingId = bookingId;
        this.commissionId = commissionId;
        this.paymentAmount = paymentAmount;
        this.paymentDate = paymentDate;
        this.note = note;
        this.createdAt = LocalDateTime.now().toString();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public String getCommissionId() {
        return commissionId;
    }

    public void setCommissionId(String commissionId) {
        this.commissionId = commissionId;
    }

    public double getPaymentAmount() {
        return paymentAmount;
    }

    public void setPaymentAmount(double paymentAmount) {
        this.paymentAmount = paymentAmount;
    }

    public String getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(String paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
