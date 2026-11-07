package com.rideflow.service;

import com.rideflow.entity.Booking;
import com.rideflow.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${RIDEFLOW_EMAIL_HOST:}")
    private String emailHost;

    public void sendVerificationEmail(String toEmail, String code) {
        String subject = "Verify your RideFlow account";
        String body = "Hello,\n\n" +
                "Welcome to RideFlow! Please use the following 6-digit verification code to activate your account:\n\n" +
                "    Verification Code: " + code + "\n\n" +
                "This code will expire in 10 minutes.\n" +
                "If you did not request this, please disregard this email.\n\n" +
                "Best regards,\n" +
                "The RideFlow Team";

        dispatchEmail(toEmail, subject, body, "Email Verification", code);
    }

    public void sendPasswordResetEmail(String toEmail, String resetCode) {
        String subject = "RideFlow Password Reset Code";
        String body = "Hello,\n\n" +
                "We received a request to reset your password for RideFlow.\n" +
                "Please use the following 6-digit code to reset your password:\n\n" +
                "    Reset Code: " + resetCode + "\n\n" +
                "This code will expire in 15 minutes.\n" +
                "If you did not request this password reset, please secure your account immediately.\n\n" +
                "Best regards,\n" +
                "The RideFlow Team";

        dispatchEmail(toEmail, subject, body, "Password Reset", resetCode);
    }

    /**
     * Email 1: Sent to customer immediately upon creating a booking.
     * Explains booking details and states driver details will follow once accepted.
     */
    public void sendBookingConfirmationEmail(Booking booking) {
        if (booking == null || booking.getUserEmail() == null || booking.getUserEmail().trim().isEmpty()) {
            return;
        }

        String isDriverOnly = ("ONLY_DRIVER".equalsIgnoreCase(booking.getVehicleOption()) ||
                               "DRIVER_ONLY".equalsIgnoreCase(booking.getVehicleOption()))
                               ? "Only Driver (Your Personal Vehicle)"
                               : "Driver + Rental Vehicle";

        StringBuilder sb = new StringBuilder();
        sb.append("Dear ").append(booking.getUserName() != null ? booking.getUserName() : "Valued Customer").append(",\n\n");
        sb.append("Thank you for choosing RideFlow! Your ride request has been successfully created.\n\n");
        sb.append("====================================================\n");
        sb.append("BOOKING SUMMARY\n");
        sb.append("====================================================\n");
        sb.append("• Booking ID: ").append(booking.getBookingId() != null ? booking.getBookingId() : booking.getId()).append("\n");
        sb.append("• Service Type: ").append(isDriverOnly).append("\n");
        sb.append("• Pickup Location: ").append(booking.getPickup()).append("\n");
        sb.append("• Destination: ").append(booking.getDestination()).append("\n");
        sb.append("• Travel Date: ").append(booking.getDate()).append("\n");
        sb.append("• Travel Time: ").append(booking.getTime()).append("\n");

        if ("ONLY_DRIVER".equalsIgnoreCase(booking.getVehicleOption()) || "DRIVER_ONLY".equalsIgnoreCase(booking.getVehicleOption())) {
            sb.append("• Personal Car: ").append(booking.getCustomerCarName() != null ? booking.getCustomerCarName() : "Customer Car");
            if (booking.getTransmission() != null) {
                sb.append(" (").append(booking.getTransmission()).append(")");
            }
            sb.append("\n");
            if (booking.getDescription() != null && !booking.getDescription().trim().isEmpty()) {
                sb.append("• Car Notes: ").append(booking.getDescription()).append("\n");
            }
        } else {
            sb.append("• Rental Vehicle: ").append(booking.getVehicleName() != null ? booking.getVehicleName() : booking.getVehicleType()).append("\n");
        }

        sb.append("====================================================\n\n");
        sb.append("WHAT HAPPENS NEXT:\n");
        sb.append("1. A verified professional chauffeur will be assigned to your booking shortly.\n");
        sb.append("2. Once the assigned driver accepts your ride, their full name, phone number, and contact details will be automatically sent to you via email and displayed on the RideFlow website.\n");
        sb.append("3. You can monitor your ride status anytime in your RideFlow customer dashboard.\n\n");
        sb.append("Thank you once again for choosing RideFlow!\n\n");
        sb.append("Warm regards,\n");
        sb.append("The RideFlow Team\n");

        String subject = "Booking Confirmed - RideFlow [ID: " + (booking.getBookingId() != null ? booking.getBookingId() : booking.getId()) + "]";
        dispatchEmail(booking.getUserEmail(), subject, sb.toString(), "Booking Confirmation to Customer", null);
    }

    /**
     * Email 2: Sent to customer when driver accepts the booking.
     * Contains driver's contact and name.
     */
    public void sendDriverAcceptedEmailToCustomer(Booking booking, User driver) {
        if (booking == null || booking.getUserEmail() == null || booking.getUserEmail().trim().isEmpty()) {
            return;
        }

        String driverName = (driver != null && driver.getName() != null) ? driver.getName() : (booking.getDriverName() != null ? booking.getDriverName() : "Assigned Driver");
        String driverPhone = (driver != null && driver.getPhone() != null) ? driver.getPhone() : (booking.getDriverPhone() != null ? booking.getDriverPhone() : "N/A");
        String driverEmail = (driver != null && driver.getUserEmail() != null) ? driver.getUserEmail() : "";

        StringBuilder sb = new StringBuilder();
        sb.append("Dear ").append(booking.getUserName() != null ? booking.getUserName() : "Valued Customer").append(",\n\n");
        sb.append("Great news! Your driver has ACCEPTED your RideFlow booking.\n\n");
        sb.append("====================================================\n");
        sb.append("ASSIGNED DRIVER DETAILS\n");
        sb.append("====================================================\n");
        sb.append("• Driver Name: ").append(driverName).append("\n");
        sb.append("• Driver Contact: ").append(driverPhone).append("\n");
        if (!driverEmail.isEmpty()) {
            sb.append("• Driver Email: ").append(driverEmail).append("\n");
        }
        sb.append("====================================================\n");
        sb.append("RIDE DETAILS\n");
        sb.append("====================================================\n");
        sb.append("• Booking ID: ").append(booking.getBookingId() != null ? booking.getBookingId() : booking.getId()).append("\n");
        sb.append("• Pickup: ").append(booking.getPickup()).append("\n");
        sb.append("• Destination: ").append(booking.getDestination()).append("\n");
        sb.append("• Date & Time: ").append(booking.getDate()).append(" at ").append(booking.getTime()).append("\n");
        if (booking.getCustomerCarName() != null) {
            sb.append("• Car: ").append(booking.getCustomerCarName()).append(" (").append(booking.getTransmission() != null ? booking.getTransmission() : "").append(")\n");
        } else if (booking.getVehicleName() != null) {
            sb.append("• Vehicle: ").append(booking.getVehicleName()).append("\n");
        }
        sb.append("====================================================\n\n");
        sb.append("Your driver will reach your pickup location on time. You can contact them directly or view real-time updates on your RideFlow dashboard.\n\n");
        sb.append("Warm regards,\n");
        sb.append("The RideFlow Team\n");

        String subject = "Driver Confirmed! - RideFlow [ID: " + (booking.getBookingId() != null ? booking.getBookingId() : booking.getId()) + "]";
        dispatchEmail(booking.getUserEmail(), subject, sb.toString(), "Driver Accepted Notification to Customer", null);
    }

    /**
     * Email 3: Sent to driver when ride is assigned / accepted.
     * Contains customer details and pickup info.
     */
    public void sendRideAssignedEmailToDriver(Booking booking, User driver) {
        String driverToEmail = (driver != null && driver.getUserEmail() != null) ? driver.getUserEmail() : null;
        if (driverToEmail == null || driverToEmail.trim().isEmpty()) {
            return;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Dear ").append(driver != null && driver.getName() != null ? driver.getName() : "Driver").append(",\n\n");
        sb.append("You have accepted ride booking #").append(booking.getBookingId() != null ? booking.getBookingId() : booking.getId()).append(".\n\n");
        sb.append("====================================================\n");
        sb.append("CUSTOMER & RIDE DETAILS\n");
        sb.append("====================================================\n");
        sb.append("• Customer Name: ").append(booking.getUserName() != null ? booking.getUserName() : "Customer").append("\n");
        sb.append("• Customer Phone: ").append(booking.getUserPhone() != null ? booking.getUserPhone() : "N/A").append("\n");
        sb.append("• Customer Email: ").append(booking.getUserEmail() != null ? booking.getUserEmail() : "N/A").append("\n");
        sb.append("• Pickup Location: ").append(booking.getPickup()).append("\n");
        sb.append("• Destination: ").append(booking.getDestination()).append("\n");
        sb.append("• Scheduled Date: ").append(booking.getDate()).append("\n");
        sb.append("• Scheduled Time: ").append(booking.getTime()).append("\n");
        sb.append("• Ride Type: ").append(booking.getRideType()).append("\n");

        if ("ONLY_DRIVER".equalsIgnoreCase(booking.getVehicleOption()) || "DRIVER_ONLY".equalsIgnoreCase(booking.getVehicleOption())) {
            sb.append("• Service: ONLY DRIVER (Driving Customer's Car)\n");
            sb.append("• Customer Car: ").append(booking.getCustomerCarName() != null ? booking.getCustomerCarName() : "Personal Vehicle");
            if (booking.getTransmission() != null) {
                sb.append(" [").append(booking.getTransmission()).append("]");
            }
            sb.append("\n");
            if (booking.getDescription() != null && !booking.getDescription().trim().isEmpty()) {
                sb.append("• Car Description / Notes: ").append(booking.getDescription()).append("\n");
            }
        } else {
            sb.append("• Service: DRIVER + VEHICLE (Rental)\n");
            sb.append("• Assigned Vehicle: ").append(booking.getVehicleName() != null ? booking.getVehicleName() : booking.getVehicleType()).append("\n");
        }

        sb.append("====================================================\n\n");
        sb.append("Please arrive promptly at the pickup location. You can view navigation and full details in your RideFlow Driver Dashboard.\n\n");
        sb.append("Drive safely,\n");
        sb.append("The RideFlow Team\n");

        String subject = "Ride Confirmed & Customer Details - RideFlow [ID: " + (booking.getBookingId() != null ? booking.getBookingId() : booking.getId()) + "]";
        dispatchEmail(driverToEmail, subject, sb.toString(), "Ride Details to Driver", null);
    }

    private void dispatchEmail(String toEmail, String subject, String body, String type, String code) {
        boolean sentSuccessfully = false;

        logger.info("Attempting to send '{}' email to {}. Configured username: {}", type, toEmail, mailUsername);

        if (mailSender != null && mailUsername != null && !mailUsername.trim().isEmpty() && toEmail != null && !toEmail.trim().isEmpty()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailUsername);
                message.setTo(toEmail);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                sentSuccessfully = true;
                logger.info("Successfully dispatched {} email to {} via Gmail SMTP", type, toEmail);
            } catch (Exception ex) {
                logger.error("Could not dispatch {} via SMTP: {}", type, ex.getMessage(), ex);
            }
        } else {
            logger.warn("MailSender is null or mailUsername is empty. Skipping SMTP dispatch.");
        }

        if (!sentSuccessfully) {
            // Development fallback logging for local testing
            System.out.println("==========================================================");
            System.out.println("  [DEVELOPMENT EMAIL SERVICE FALLBACK] " + type);
            System.out.println("  Recipient : " + toEmail);
            System.out.println("  Subject   : " + subject);
            if (code != null) {
                System.out.println("  Code      : " + code);
            }
            System.out.println("==========================================================");
        }
    }
}
