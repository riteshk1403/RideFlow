package com.rideflow;

import com.rideflow.entity.Vehicle;
import com.rideflow.repository.VehicleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.Arrays;
import java.util.List;

@SpringBootApplication
public class RideflowApplication {

    public static void main(String[] args) {
        SpringApplication.run(RideflowApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(VehicleRepository vehicleRepository) {
        return args -> {
            try {
                if (vehicleRepository.count() == 0) {
                    List<Vehicle> sampleVehicles = Arrays.asList(
                        new Vehicle(
                            null,
                            "Honda City",
                            "SEDAN",
                            "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
                            4,
                            true,
                            300.0,
                            5000.0,
                            14.0,
                            10.0
                        ),
                        new Vehicle(
                            null,
                            "Toyota Innova Crysta",
                            "SUV",
                            "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
                            7,
                            true,
                            300.0,
                            8000.0,
                            18.0,
                            10.0
                        ),
                        new Vehicle(
                            null,
                            "Rolls Royce Classic",
                            "VINTAGE",
                            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
                            4,
                            true,
                            150.0,
                            15000.0,
                            30.0,
                            15.0
                        ),
                        new Vehicle(
                            null,
                            "Mercedes S-Class",
                            "LUXURY",
                            "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
                            4,
                            true,
                            300.0,
                            12000.0,
                            25.0,
                            12.0
                        ),
                        new Vehicle(
                            null,
                            "Force Urbania Luxury",
                            "TRAVELLER",
                            "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
                            12,
                            true,
                            300.0,
                            14000.0,
                            22.0,
                            10.0
                        )
                    );
                    vehicleRepository.saveAll(sampleVehicles);
                    System.out.println("RideFlow: Pre-seeded initial vehicle fleet with pricing packages.");
                }
            } catch (Exception e) {
                System.err.println("Database initialization notice: " + e.getMessage());
            }
        };
    }
}
