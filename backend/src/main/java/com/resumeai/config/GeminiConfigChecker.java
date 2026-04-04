package com.resumeai.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.EnvironmentAware;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class GeminiConfigChecker implements EnvironmentAware {

    private static final Logger logger = LoggerFactory.getLogger(GeminiConfigChecker.class);

    private Environment environment;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateGeminiConfiguration() {
        String apiKey = environment.getProperty("app.gemini.api-key", "");
        String apiUrl = environment.getProperty("app.gemini.api-url", "");

        Path cwd = Path.of(".").toAbsolutePath().normalize();
        Path rootEnv = cwd.resolve(".env");
        Path backendEnv = cwd.resolve("backend/.env");

        logger.info("Gemini config check: working dir={}, .env exists={}, backend/.env exists={}",
                cwd, Files.exists(rootEnv), Files.exists(backendEnv));

        if (apiKey.isBlank()) {
            logger.error("Gemini API key is not configured. Ensure GEMINI_API_KEY is set in backend/.env or .env and restart the app.");
        } else if (apiKey.contains("your_gemini_api_key")) {
            logger.error("Gemini API key is still the placeholder value. Replace GEMINI_API_KEY in backend/.env with a valid API key.");
        } else {
            String maskedKey = apiKey.length() > 8 ? apiKey.substring(0, 4) + "****" + apiKey.substring(apiKey.length() - 4) : "[masked]";
            logger.info("Gemini API key loaded successfully: {} (masked)", maskedKey);
        }

        if (apiUrl.isBlank()) {
            logger.error("Gemini API URL is not configured. Ensure GEMINI_API_URL is set in backend/.env or .env.");
        } else {
            logger.info("Gemini API URL loaded: {}", apiUrl);
        }
    }
}
