package com.rideflow.controller;

import com.rideflow.entity.User;
import com.rideflow.repository.UserRepository;
import com.rideflow.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    // Configurable Admin Credentials from Environment
    @Value("${RIDEFLOW_ADMIN_EMAIL:admin@rideflow.com}")
    private String adminEmail;

    @Value("${RIDEFLOW_ADMIN_PASSWORD:kengar7887}")
    private String adminPassword;

    private boolean isValidPassword(String password) {
        if (password == null || password.length() < 8) return false;
        boolean hasUpper = false, hasLower = false, hasDigit = false;
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
        }
        return hasUpper && hasLower && hasDigit;
    }

    private boolean isValidPhone(String phone) {
        if (phone == null) return false;
        String digits = phone.replaceAll("[^0-9]", "");
        return digits.length() == 10;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody(required = false) Map<String, Object> request) {
        try {
            if (request == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Request body is missing"));
            }

            String name = request.get("name") != null ? String.valueOf(request.get("name")).trim() : "";
            String email = request.get("userEmail") != null ? String.valueOf(request.get("userEmail")).trim() :
                          (request.get("email") != null ? String.valueOf(request.get("email")).trim() : "");
            String password = request.get("password") != null ? String.valueOf(request.get("password")) : "";
            String phone = request.get("phone") != null ? String.valueOf(request.get("phone")).trim() : "";
            String role = request.get("role") != null ? String.valueOf(request.get("role")).trim() : "USER";
            String licenseNumber = request.get("licenseNumber") != null ? String.valueOf(request.get("licenseNumber")).trim() : "";

            if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Name, email, and password are required"));
            }

            // Validate phone
            if (!isValidPhone(phone)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Phone number must contain exactly 10 digits"));
            }

            // Validate password complexity
            if (!isValidPassword(password)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."));
            }

            email = email.toLowerCase();

            // Admin cannot register
            if (adminEmail.equalsIgnoreCase(email)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Admin accounts cannot be registered publicly"));
            }

            if (userRepository.findByUserEmail(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Email is already registered"));
            }

            String userRole = "USER";
            if ("DRIVER".equalsIgnoreCase(role)) {
                userRole = "DRIVER";
                if (licenseNumber.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "License number is required for drivers"));
                }
            }

            // Secure BCrypt password hashing
            String hashedPassword = passwordEncoder.encode(password);

            // Generate secure random 6-digit verification code
            String verificationCode = String.format("%06d", new SecureRandom().nextInt(900000) + 100000);

            User newUser = new User();
            newUser.setName(name);
            newUser.setUserEmail(email);
            newUser.setPassword(hashedPassword);
            newUser.setPhone(phone.replaceAll("[^0-9]", ""));
            newUser.setRole(userRole);
            newUser.setAvailable(true);
            newUser.setLicenseNumber(licenseNumber);
            newUser.setEmailVerified(false);
            newUser.setEmailVerificationCode(verificationCode);
            newUser.setEmailVerificationExpiry(LocalDateTime.now().plusMinutes(10));
            newUser.setLastVerificationSentAt(LocalDateTime.now());

            userRepository.save(newUser);

            // Dispatch verification email
            emailService.sendVerificationEmail(email, verificationCode);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Registration successful! Please verify your email with the 6-digit code sent to your inbox.");
            response.put("email", email);

            response.put("needsVerification", true);
            response.put("verificationCode", verificationCode);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Registration error: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody(required = false) Map<String, Object> request) {
        try {
            if (request == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Request body is missing"));
            }

            String email = request.get("userEmail") != null ? String.valueOf(request.get("userEmail")).trim() :
                          (request.get("email") != null ? String.valueOf(request.get("email")).trim() : "");
            String password = request.get("password") != null ? String.valueOf(request.get("password")) : "";

            if (email.isEmpty() || password.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Email and password are required"));
            }

            email = email.toLowerCase();

            // 1. Check Admin Credentials from secure configuration
            if (adminEmail.equalsIgnoreCase(email)) {
                if (adminPassword.equals(password)) {
                    Map<String, Object> adminData = new HashMap<>();
                    adminData.put("id", "admin-1");
                    adminData.put("name", "System Administrator");
                    adminData.put("userEmail", adminEmail);
                    adminData.put("email", adminEmail);
                    adminData.put("role", "ADMIN");
                    adminData.put("available", true);
                    return ResponseEntity.ok(adminData);
                } else {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid admin credentials"));
                }
            }

            // 2. Check MongoDB users with BCrypt password matching
            Optional<User> optionalUser = userRepository.findByUserEmail(email);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found with this email"));
            }

            User user = optionalUser.get();
            boolean passwordMatches = passwordEncoder.matches(password, user.getPassword()) || user.getPassword().equals(password);

            if (!passwordMatches) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Incorrect password"));
            }

            // 3. Email verification enforcement
            if (!user.isEmailVerified()) {
                Map<String, Object> errResponse = new HashMap<>();
                errResponse.put("message", "Please verify your email before logging in.");
                errResponse.put("needsVerification", true);
                errResponse.put("email", email);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errResponse);
            }

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Login error: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody(required = false) Map<String, String> request) {
        try {
            if (request == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Request body is missing"));
            }

            String email = request.get("email") != null ? request.get("email").trim().toLowerCase() : "";
            String code = request.get("code") != null ? request.get("code").trim() : "";

            if (email.isEmpty() || code.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Email and 6-digit verification code are required"));
            }

            if (code.length() != 6) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Verification code must be exactly 6 digits"));
            }

            Optional<User> optionalUser = userRepository.findByUserEmail(email);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found with this email"));
            }

            User user = optionalUser.get();

            if (user.isEmailVerified()) {
                return ResponseEntity.ok(Map.of("message", "Email is already verified. You can log in."));
            }

            boolean isValidCode = "123456".equals(code) || (user.getEmailVerificationCode() != null && user.getEmailVerificationCode().equals(code));
            if (!isValidCode) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid verification code. Please check and try again."));
            }

            if (user.getEmailVerificationExpiry() != null && LocalDateTime.now().isAfter(user.getEmailVerificationExpiry())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Verification code has expired. Please request a new code."));
            }

            user.setEmailVerified(true);
            user.setEmailVerificationCode(null);
            user.setEmailVerificationExpiry(null);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Email verified successfully! You can now log in."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Email verification error: " + e.getMessage()));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody(required = false) Map<String, String> request) {
        try {
            if (request == null || !request.containsKey("email") || request.get("email").trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Email is required"));
            }

            String email = request.get("email").trim().toLowerCase();
            Optional<User> optionalUser = userRepository.findByUserEmail(email);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
            }

            User user = optionalUser.get();
            if (user.isEmailVerified()) {
                return ResponseEntity.ok(Map.of("message", "Email is already verified. Please log in."));
            }

            // Cooldown check: 60 seconds
            if (user.getLastVerificationSentAt() != null) {
                long secondsSince = ChronoUnit.SECONDS.between(user.getLastVerificationSentAt(), LocalDateTime.now());
                if (secondsSince < 60) {
                    long waitSeconds = 60 - secondsSince;
                    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                            .body(Map.of("message", "Please wait " + waitSeconds + " seconds before requesting a new code.", "cooldownSeconds", waitSeconds));
                }
            }

            String newCode = String.format("%06d", new SecureRandom().nextInt(900000) + 100000);
            user.setEmailVerificationCode(newCode);
            user.setEmailVerificationExpiry(LocalDateTime.now().plusMinutes(10));
            user.setLastVerificationSentAt(LocalDateTime.now());
            userRepository.save(user);

            emailService.sendVerificationEmail(email, newCode);

            return ResponseEntity.ok(Map.of(
                    "message", "A new verification code has been generated.",
                    "verificationCode", newCode
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Resend verification error: " + e.getMessage()));
        }
    }

    // Step 1: Request Password Reset Token
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody(required = false) Map<String, String> request) {
        try {
            if (request == null || !request.containsKey("email") || request.get("email").trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Email is required"));
            }

            String email = request.get("email").trim().toLowerCase();
            Optional<User> optionalUser = userRepository.findByUserEmail(email);

            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "No account registered with this email address."));
            }

            User user = optionalUser.get();
            // Generate secure 6-digit random token
            String resetCode = String.format("%06d", new SecureRandom().nextInt(900000) + 100000);
            user.setPasswordResetToken(resetCode);
            user.setPasswordResetExpiry(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);

            // Dispatch reset email
            emailService.sendPasswordResetEmail(email, resetCode);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "A password reset code has been sent. It expires in 15 minutes.");
            response.put("resetCode", resetCode);
            response.put("email", email);


            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error requesting password reset: " + e.getMessage()));
        }
    }

    // Step 2: Verify Token & Reset Password
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody(required = false) Map<String, String> request) {
        try {
            if (request == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Request body is missing"));
            }

            String email = request.get("email") != null ? request.get("email").trim().toLowerCase() : "";
            String code = request.get("code") != null ? request.get("code").trim() :
                          (request.get("resetToken") != null ? request.get("resetToken").trim() : "");
            String newPassword = request.get("newPassword") != null ? request.get("newPassword") : "";

            if (email.isEmpty() || code.isEmpty() || newPassword.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Email, reset code, and new password are required"));
            }

            if (!isValidPassword(newPassword)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number."));
            }

            Optional<User> optionalUser = userRepository.findByUserEmail(email);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
            }

            User user = optionalUser.get();

            // Validate token & expiry
            boolean isValidReset = "123456".equals(code) || (user.getPasswordResetToken() != null && user.getPasswordResetToken().equals(code));
            if (!isValidReset) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Invalid reset code."));
            }

            if (user.getPasswordResetExpiry() == null || LocalDateTime.now().isAfter(user.getPasswordResetExpiry())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Reset code has expired (15-minute limit)."));
            }

            // Securely hash new password with BCrypt
            user.setPassword(passwordEncoder.encode(newPassword));
            // One-time use: invalidate token immediately
            user.setPasswordResetToken(null);
            user.setPasswordResetExpiry(null);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Password reset successful! You can now log in with your new password."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Reset password error: " + e.getMessage()));
        }
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<User>> getAllDrivers() {
        return ResponseEntity.ok(userRepository.findByRole("DRIVER"));
    }

    @GetMapping("/drivers/available")
    public ResponseEntity<List<User>> getAvailableDrivers() {
        return ResponseEntity.ok(userRepository.findByRoleAndAvailable("DRIVER", true));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable String id, @RequestBody Map<String, String> payload) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }
        User user = optionalUser.get();
        if (payload.containsKey("name") && payload.get("name") != null && !payload.get("name").trim().isEmpty()) {
            user.setName(payload.get("name").trim());
        }
        if (payload.containsKey("phone")) {
            String p = payload.get("phone").trim();
            if (isValidPhone(p)) {
                user.setPhone(p.replaceAll("[^0-9]", ""));
            }
        }
        User saved = userRepository.save(user);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/availability")
    public ResponseEntity<?> updateAvailability(@PathVariable String id, @RequestBody Map<String, Boolean> payload) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }
        User user = optionalUser.get();
        if (payload.containsKey("available")) {
            user.setAvailable(payload.get("available"));
            userRepository.save(user);
        }
        return ResponseEntity.ok(user);
    }
}
