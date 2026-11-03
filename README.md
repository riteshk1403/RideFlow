# RideFlow - Driver & Vehicle Booking Platform

A full-stack web application built with **Spring Boot 3.2.x**, **Java 17**, **MongoDB**, **Spring Data MongoDB**, **BCrypt password security**, and **React** with dark glassmorphic styling.

---

## 🚀 Key Features

1. **Welcome Landing Page (`/`)**:
   - Modern hero section with "Get Started" and "Explore Services".
   - Feature highlights: Easy Booking, Trusted Drivers, Real-Time Status, Dedicated Support.
   - 5-step workflow overview and vehicle category showcase (SEDAN, SUV, LUXURY, VINTAGE, TRAVELLER).
   - Centralized click-to-call admin support footer.

2. **Unified Authentication (`/auth`)**:
   - Role-based registration: `USER` and `DRIVER` (Admin registration is strictly disallowed).
   - BCrypt password hashing (`min 8 characters`, uppercase, lowercase, and digit validation).
   - Enforced 10-digit phone number validation.
   - Admin account configured securely via environment variables (`RIDEFLOW_ADMIN_EMAIL`, `RIDEFLOW_ADMIN_PASSWORD`).

3. **Email Verification (`/verify-email`)**:
   - Compulsory email verification for regular Users and Drivers before login.
   - Secure random 6-digit verification code with 10-minute expiry.
   - Resend code endpoint with 60-second cooldown protection.
   - Integrated with `spring-boot-starter-mail` (SMTP for production, development console logging fallback).

4. **Secure Password Reset Flow (`/forgot-password` & `/reset-password`)**:
   - 6-digit one-time reset token with 15-minute expiry.
   - Tokens are invalidated immediately upon successful reset.
   - Passwords and reset tokens are protected and never serialized in API responses.

5. **Customer Booking (`/booking`)**:
   - Book with exact 10-digit phone, route, date, time, and vehicle selection.
   - Geolocation pickup detection with reverse geocoding.
   - **No fare calculated during initial booking creation** (status starts as `PENDING`).
   - Customer contact privacy: Driver contact is protected with *"Waiting for driver acceptance"* until confirmed.

6. **Vehicle Management & Pricing Packages**:
   - Admin defines pricing per vehicle:
     - `Included Distance (KM)` (e.g. 300 KM)
     - `Base Package Price (₹)` (e.g. ₹8,000)
     - `Extra KM Price (₹/KM)` (e.g. ₹18 / KM)
     - `Platform Commission (%)` (e.g. 10%)
   - Full CRUD: Add, edit, delete, and view fleet configurations with live image preview.

7. **Driver Ride Completion & Backend Fare Calculation (`/driver`)**:
   - Progressive workflow: `ASSIGNED` ➔ `ACCEPTED` ➔ `REACHED_PICKUP` ➔ `STARTED` ➔ `COMPLETED`.
   - Driver must enter actual completed distance in KM upon completing the ride.
   - **Backend Fare Calculation**:
     - If `actualKm <= includedKm`: `Final Fare = Base Price`
     - If `actualKm > includedKm`: `Final Fare = Base Price + ((actualKm - includedKm) * extraKmPrice)`
   - **Commission Breakdown**:
     - `Commission Amount = Final Fare * (Commission % / 100)`
     - `Driver Earnings = Final Fare - Commission Amount`
     - `Remaining Commission = Commission Amount`

8. **Driver Commission History**:
   - Dedicated commission summary cards: Total Earnings, Total Commission, Paid Commission, Pending Commission.
   - Complete ledger of all completed rides with status (`PENDING`, `PARTIALLY PAID`, `PAID`).

9. **Admin Commission Dashboard & Manual Settlement (`/admin`)**:
   - Platform overview cards (Total Commission, Paid Commission, Pending Commission, Total Fare).
   - Driver-wise aggregated commission table.
   - Record manual commission payments made by drivers (supports partial payments, validates against remaining balance).
   - Immutable payment history audit log (`CommissionPayment` collection).

10. **Customer & Driver Support**:
    - Centralized `ADMIN_PHONE` link (`tel:${ADMIN_PHONE}`) across all customer, driver, and landing pages.
    - In-app "Report a Problem" modal with categorized tickets (`OPEN`, `IN_PROGRESS`, `RESOLVED`).

---

## 🛠️ Technology Stack

* **Backend**: Java 17, Spring Boot 3.2.5, Maven, Spring Data MongoDB, Spring Web, BCrypt (`spring-security-crypto`), JavaMail (`spring-boot-starter-mail`).
* **Frontend**: React 18, React Router v6, Axios, Vanilla CSS (Glassmorphism).
* **Database**: MongoDB (`mongodb://localhost:27017/rideflow`).

---

## ⚙️ Environment Variables (`.env.example`)

```text
RIDEFLOW_MONGODB_URI=mongodb://localhost:27017/rideflow
RIDEFLOW_ADMIN_EMAIL=admin@rideflow.com
RIDEFLOW_ADMIN_PASSWORD=Admin@123
RIDEFLOW_ENCRYPTION_KEY=RideFlowSuperSecure256BitKey!Dev
RIDEFLOW_EMAIL_HOST=smtp.gmail.com
RIDEFLOW_EMAIL_PORT=587
RIDEFLOW_EMAIL_USERNAME=
RIDEFLOW_EMAIL_PASSWORD=
```

---

## 🚀 Running the Application

### Option A: Using Quick Launch Batch Scripts
1. Start Backend: Double-click `start-backend.bat`
2. Start Frontend: Double-click `start-frontend.bat`

### Option B: Manual Terminal Execution
```bash
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend
npm start
```

* **Frontend**: `http://localhost:3000` (or `http://localhost:5173`)
* **Backend API**: `http://localhost:8080/api`
* **Default Admin**: `admin@rideflow.com` / `Admin@123`
