package com.resumeai.service;

import com.resumeai.dto.AuthDto;
import com.resumeai.entity.User;
import com.resumeai.exception.ResourceAlreadyExistsException;
import com.resumeai.repository.UserRepository;
import com.resumeai.security.JwtUtils;
import com.resumeai.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtils jwtUtils;

    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Email already in use: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);

        String token = jwtUtils.generateTokenFromEmail(user.getEmail());
        return new AuthDto.AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getMobile(),
                user.getProfilePicture(),
                user.getHeadline(),
                user.getBio()
        );
    }

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String token = jwtUtils.generateTokenFromEmail(request.getEmail());
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        return new AuthDto.AuthResponse(
                token,
                userDetails.getId(),
                userDetails.getName(),
                userDetails.getUsername(),
                user.getMobile(),
                user.getProfilePicture(),
                user.getHeadline(),
                user.getBio()
        );
    }

    public AuthDto.UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        AuthDto.UserResponse response = new AuthDto.UserResponse();
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setMobile(user.getMobile());
        response.setProfilePicture(user.getProfilePicture());
        response.setHeadline(user.getHeadline());
        response.setBio(user.getBio());
        response.setCreatedAt(user.getCreatedAt().toString());
        response.setUpdatedAt(user.getUpdatedAt() != null ? user.getUpdatedAt().toString() : null);
        return response;
    }

    public AuthDto.UserResponse updateProfile(String email, AuthDto.UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(request.getName().trim());
        user.setMobile(trimToNull(request.getMobile()));
        user.setHeadline(trimToNull(request.getHeadline()));
        user.setBio(trimToNull(request.getBio()));
        user.setProfilePicture(trimToNull(request.getProfilePicture()));

        userRepository.save(user);
        return getCurrentUser(email);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
