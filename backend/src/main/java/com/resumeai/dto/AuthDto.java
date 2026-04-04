package com.resumeai.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDto {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String type = "Bearer";
        private Long id;
        private String name;
        private String email;
        private String mobile;
        private String profilePicture;
        private String headline;
        private String bio;

        public AuthResponse(String token, Long id, String name, String email,
                            String mobile, String profilePicture, String headline, String bio) {
            this.token = token;
            this.id = id;
            this.name = name;
            this.email = email;
            this.mobile = mobile;
            this.profilePicture = profilePicture;
            this.headline = headline;
            this.bio = bio;
        }
    }

    @Data
    public static class UserResponse {
        private Long id;
        private String name;
        private String email;
        private String mobile;
        private String profilePicture;
        private String headline;
        private String bio;
        private String createdAt;
        private String updatedAt;
    }

    @Data
    public static class UpdateProfileRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @Size(max = 20, message = "Mobile number is too long")
        private String mobile;

        @Size(max = 120, message = "Headline must be 120 characters or fewer")
        private String headline;

        @Size(max = 1000, message = "Bio must be 1000 characters or fewer")
        private String bio;

        @Size(max = 50000, message = "Profile image data is too long")
        private String profilePicture;
    }
}
