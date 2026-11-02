package com.rideflow.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "supportRequests")
public class SupportRequest {

    @Id
    private String id;
    private String bookingId;
    private String userId;
    private String userName;
    private String userRole;
    private String phone;
    private String problemType; // Driver Issue, Customer Issue, Vehicle Issue, Booking Issue, Payment Issue, Location Issue, Other
    private String description;
    private String status = "OPEN"; // OPEN, IN_PROGRESS, RESOLVED
    private String createdAt;

    public SupportRequest() {
    }

    public SupportRequest(String id, String bookingId, String userId, String userName, String userRole, String phone, String problemType, String description, String status, String createdAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole;
        this.phone = phone;
        this.problemType = problemType;
        this.description = description;
        this.status = status;
        this.createdAt = createdAt;
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

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getProblemType() {
        return problemType;
    }

    public void setProblemType(String problemType) {
        this.problemType = problemType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
