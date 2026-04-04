package com.resumeai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);
    private static final Pattern WORD_PATTERN = Pattern.compile("\\b[\\w+#.]{2,}\\b");
    private static final Pattern NUMBER_PATTERN = Pattern.compile("\\b\\d+(?:\\.\\d+)?%?\\b");
    private static final Set<String> STOP_WORDS = Set.of(
            "about", "after", "again", "also", "been", "between", "build", "built", "could",
            "does", "from", "have", "into", "just", "more", "most", "that", "their", "them",
            "there", "these", "this", "with", "would", "your", "what", "when", "where", "which",
            "while", "tell", "explain", "describe", "role", "using", "used", "project", "projects",
            "candidate", "answer", "question", "experience"
    );

    @Value("${app.gemini.api-key:}")
    private String apiKey;

    @Value("${app.gemini.api-url}")
    private String apiUrl;

    @Value("${app.gemini.max-retries:3}")
    private int maxRetries;

    @Value("${app.gemini.initial-backoff-ms:1200}")
    private long initialBackoffMs;

    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String callGemini(String prompt) {
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("your_gemini_api_key")) {
            throw new GeminiRetryableException("Gemini API key is not configured.");
        }

        String requestBody;
        try {
            requestBody = buildRequestBody(prompt);
        } catch (Exception e) {
            throw new RuntimeException("Failed to prepare AI request: " + e.getMessage(), e);
        }

        int totalAttempts = Math.max(1, maxRetries + 1);
        GeminiRetryableException lastRetryable = null;

        for (int attempt = 1; attempt <= totalAttempts; attempt++) {
            try {
                return executeRequest(requestBody);
            } catch (GeminiRetryableException ex) {
                lastRetryable = ex;
                if (attempt >= totalAttempts) {
                    break;
                }

                long delayMs = calculateBackoffDelay(attempt);
                logger.warn("Gemini transient failure on attempt {}/{}. Retrying in {} ms. Reason: {}",
                        attempt, totalAttempts, delayMs, ex.getMessage());
                sleepBeforeRetry(delayMs);
            }
        }

        throw new RuntimeException("The AI service is temporarily busy. Please try again in a few moments.");
    }

    private String executeRequest(String requestBody) {
        Request request = new Request.Builder()
                .url(apiUrl)
                .addHeader("X-Goog-Api-Key", apiKey)
                .post(RequestBody.create(requestBody, MediaType.parse("application/json")))
                .build();

        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";

            if (!response.isSuccessful()) {
                String errorMessage = extractApiErrorMessage(responseBody);
                if (isRetryableStatus(response.code(), errorMessage)) {
                    throw new GeminiRetryableException("Gemini API returned " + response.code() + ": " + errorMessage);
                }

                logger.error("Gemini API error {}: {}", response.code(), errorMessage);
                throw new RuntimeException("Gemini API call failed: " + response.code() + " - " + errorMessage);
            }

            return extractTextFromResponse(responseBody);
        } catch (GeminiRetryableException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new GeminiRetryableException("Temporary network issue while reaching Gemini.", ex);
        } catch (Exception ex) {
            logger.error("Error calling Gemini API: {}", ex.getMessage());
            throw new RuntimeException("Failed to get AI response: " + ex.getMessage(), ex);
        }
    }

    private String buildRequestBody(String prompt) throws Exception {
        var parts = objectMapper.createArrayNode();
        var part = objectMapper.createObjectNode();
        part.put("text", prompt);
        parts.add(part);

        var contents = objectMapper.createArrayNode();
        var content = objectMapper.createObjectNode();
        content.put("role", "user");
        content.set("parts", parts);
        contents.add(content);

        var root = objectMapper.createObjectNode();
        root.set("contents", contents);

        var generationConfig = objectMapper.createObjectNode();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 8192);
        generationConfig.put("responseMimeType", "application/json");
        root.set("generationConfig", generationConfig);

        return objectMapper.writeValueAsString(root);
    }

    private String extractTextFromResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new RuntimeException("Gemini returned an empty response.");
        }

        JsonNode textNode = candidates.get(0)
                .path("content")
                .path("parts")
                .path(0)
                .path("text");

        String text = textNode.asText("");
        if (text.isBlank()) {
            throw new RuntimeException("Gemini returned an empty text payload.");
        }

        return text;
    }

    public String analyzeResume(String resumeText) {
        String prompt = """
            You are an expert ATS system and professional recruiter with 15+ years of experience.
            Analyze the following resume and respond ONLY with a valid JSON object (no markdown, no explanation).
            
            Resume Text:
            %s
            
            Respond with this exact JSON structure:
            {
              "atsScore": <number 0-100>,
              "strengths": ["strength1", "strength2", "strength3", "strength4", "strength5"],
              "weaknesses": ["weakness1", "weakness2", "weakness3"],
              "improvements": ["improvement1", "improvement2", "improvement3", "improvement4"],
              "jobRoles": ["role1", "role2", "role3", "role4", "role5"],
              "projectSuggestions": ["project1", "project2", "project3"],
              "quickPractice": [
                {
                  "question": "basic interview question",
                  "sampleAnswer": "short sample answer in 2-3 sentences"
                }
              ]
            }

            Be specific, actionable, and professional. ATS score should reflect keyword optimization, formatting, and content quality.
            Include 3 to 5 quickPractice items that a candidate can use immediately after the analysis as a quick practice mode.
            """.formatted(resumeText);

        return callGeminiWithFallback("resume analysis", prompt, () -> buildFallbackResumeAnalysis(resumeText));
    }

    public String generateInterviewQuestions(String resumeText, String resumeContext,
                                             String candidateName, String skills,
                                             String description, int count) {
        String prompt = """
            You are an expert technical interviewer. Generate exactly %d interview questions for the candidate below.
            Use the resume when it exists, and also use the provided candidate profile inputs such as name, skills, and description.
            Include a balanced mix of Technical, Project-based, and HR questions.
            Respond ONLY with a valid JSON object (no markdown, no explanation).

            Candidate name:
            %s

            Candidate skills:
            %s

            Candidate description:
            %s

            Resume excerpt:
            %s

            Candidate summary:
            %s
            
            Respond with this exact JSON structure:
            {
              "questions": [
                {"question": "question text here", "type": "TECHNICAL"},
                {"question": "question text here", "type": "PROJECT"},
                {"question": "question text here", "type": "HR"}
              ]
            }

            Make questions specific to the candidate's skills, past projects, target job roles, and stated experience.
            If the resume is limited or missing, rely more on the supplied profile inputs.
            Keep questions actionable, interview-ready, and fair.
            Types must be exactly: TECHNICAL, PROJECT, or HR
            """.formatted(
                count,
                candidateName,
                skills,
                description,
                resumeText,
                resumeContext.trim()
        );

        return callGeminiWithFallback(
                "interview question generation",
                prompt,
                () -> buildFallbackInterviewQuestions(resumeText, resumeContext, candidateName, skills, description, count)
        );
    }

    public String evaluateAnswer(String question, String answer, String resumeContext) {
        String prompt = """
            You are an expert technical interviewer evaluating a candidate's answer.
            Respond ONLY with a valid JSON object (no markdown, no explanation).
            
            Question: %s
            
            Candidate's Answer: %s
            
            Resume Context: %s
            
            Evaluate the answer and respond with this exact JSON structure:
            {
              "score": <number 0-10 with one decimal>,
              "strengths": "What the candidate did well in their answer",
              "weaknesses": "What was missing or could be improved",
              "improvedAnswer": "A comprehensive model answer that would score 9-10"
            }
            
            Be constructive, specific, and encouraging. Score 0-10 where 10 is perfect.
            """.formatted(question, answer, resumeContext);

        return callGeminiWithFallback(
                "answer evaluation",
                prompt,
                () -> buildFallbackAnswerEvaluation(question, answer, resumeContext)
        );
    }

    private String extractApiErrorMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "Unknown error";
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode errorNode = root.path("error");
            if (errorNode.hasNonNull("message")) {
                return errorNode.get("message").asText();
            }
        } catch (Exception ignored) {
        }

        return responseBody;
    }

    private boolean isRetryableStatus(int statusCode, String message) {
        String normalizedMessage = message == null ? "" : message.toLowerCase(Locale.ENGLISH);
        return statusCode == 429
                || statusCode == 500
                || statusCode == 502
                || statusCode == 503
                || statusCode == 504
                || normalizedMessage.contains("high demand")
                || normalizedMessage.contains("try again later")
                || normalizedMessage.contains("unavailable")
                || normalizedMessage.contains("resource exhausted");
    }

    private long calculateBackoffDelay(int attempt) {
        long exponential = (long) (initialBackoffMs * Math.pow(2, Math.max(0, attempt - 1)));
        long jitter = ThreadLocalRandom.current().nextLong(200L, 600L);
        return Math.min(exponential + jitter, 6000L);
    }

    private void sleepBeforeRetry(long delayMs) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("The AI request was interrupted while waiting to retry.");
        }
    }

    private String callGeminiWithFallback(String operation, String prompt, Supplier<String> fallbackSupplier) {
        try {
            return callGemini(prompt);
        } catch (RuntimeException ex) {
            if (shouldUseFallback(ex)) {
                logger.warn("Using local fallback for {} because Gemini is unavailable: {}", operation, ex.getMessage());
                return fallbackSupplier.get();
            }
            throw ex;
        }
    }

    private boolean shouldUseFallback(RuntimeException ex) {
        String message = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase(Locale.ENGLISH);
        return message.contains("temporarily busy")
                || message.contains("temporary network issue")
                || message.contains("gemini api key is not configured")
                || message.contains("503")
                || message.contains("429")
                || message.contains("unavailable")
                || message.contains("high demand");
    }

    private int countWords(String text) {
        Matcher matcher = WORD_PATTERN.matcher(normalizeText(text));
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        return count;
    }

    private int countSentences(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.isEmpty()) {
            return 0;
        }
        return Math.max(1, trimmed.split("[.!?]+").length);
    }

    private int countKeywordOverlap(String question, String answer) {
        String normalizedAnswer = normalizeText(answer);
        LinkedHashSet<String> keywords = new LinkedHashSet<>();
        Matcher matcher = WORD_PATTERN.matcher(normalizeText(question));

        while (matcher.find()) {
            String token = matcher.group().toLowerCase(Locale.ENGLISH);
            if (token.length() > 3 && !STOP_WORDS.contains(token)) {
                keywords.add(token);
            }
        }

        int overlap = 0;
        for (String keyword : keywords) {
            if (normalizedAnswer.contains(keyword)) {
                overlap++;
            }
        }
        return overlap;
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ENGLISH);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private boolean containsAny(String text, String... targets) {
        String normalizedText = normalizeText(text);
        for (String target : targets) {
            if (normalizedText.contains(target.toLowerCase(Locale.ENGLISH))) {
                return true;
            }
        }
        return false;
    }

    private boolean containsAny(List<String> values, String... targets) {
        for (String value : values) {
            for (String target : targets) {
                if (value.equalsIgnoreCase(target)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean containsSection(String text, String... sectionNames) {
        String normalizedText = normalizeText(text);
        for (String sectionName : sectionNames) {
            if (normalizedText.contains(sectionName.toLowerCase(Locale.ENGLISH))) {
                return true;
            }
        }
        return false;
    }

    private void fillList(List<String> list, int targetSize, String... fallbacks) {
        for (String fallback : fallbacks) {
            if (list.size() >= targetSize) {
                return;
            }
            if (!list.contains(fallback)) {
                list.add(fallback);
            }
        }
    }

    private void fillList(LinkedHashSet<String> set, int targetSize, String... fallbacks) {
        for (String fallback : fallbacks) {
            if (set.size() >= targetSize) {
                return;
            }
            set.add(fallback);
        }
    }

    private String buildFallbackResumeAnalysis(String resumeText) {
        try {
            String normalizedText = normalizeText(resumeText);
            List<String> detectedSkills = detectSkills(normalizedText);

            int wordCount = countWords(normalizedText);
            boolean hasSummary = containsSection(normalizedText, "summary", "profile", "objective");
            boolean hasExperience = containsSection(normalizedText, "experience", "employment", "work history");
            boolean hasSkills = containsSection(normalizedText, "skills", "technical skills", "core competencies")
                    || !detectedSkills.isEmpty();
            boolean hasProjects = containsSection(normalizedText, "projects", "project");
            boolean hasEducation = containsSection(normalizedText, "education", "academic");
            boolean hasMetrics = NUMBER_PATTERN.matcher(normalizedText).find();

            int atsScore = 35;
            if (hasSummary) atsScore += 8;
            if (hasExperience) atsScore += 15;
            if (hasSkills) atsScore += 10;
            if (hasProjects) atsScore += 10;
            if (hasEducation) atsScore += 8;
            if (hasMetrics) atsScore += 8;
            if (detectedSkills.size() >= 6) {
                atsScore += 8;
            } else if (detectedSkills.size() >= 3) {
                atsScore += 4;
            }
            if (wordCount < 250) atsScore -= 10;
            if (wordCount > 1400) atsScore -= 4;
            atsScore = Math.max(38, Math.min(92, atsScore));

            List<String> strengths = new ArrayList<>();
            if (hasExperience) strengths.add("Your resume includes an experience section, which helps recruiters quickly understand your background.");
            if (hasSkills) strengths.add("Relevant technical skills are visible, making it easier for ATS systems to match your profile.");
            if (hasProjects) strengths.add("Project information adds practical evidence that supports your listed skills.");
            if (hasMetrics) strengths.add("The resume contains measurable details, which improves credibility during screening.");
            if (wordCount >= 350) strengths.add("The document has enough detail to communicate your capabilities beyond a basic summary.");
            fillList(strengths, 5,
                    "The resume provides enough raw information to build a stronger, role-focused story.",
                    "Your content has enough technical context to support targeted interview preparation."
            );

            List<String> weaknesses = new ArrayList<>();
            if (!hasSummary) weaknesses.add("A concise professional summary is missing, which makes the document less focused in the first few seconds.");
            if (!hasProjects) weaknesses.add("Projects are either missing or not clearly labeled, which reduces proof of hands-on ability.");
            if (!hasMetrics) weaknesses.add("More quantified outcomes would make your achievements stronger and easier to evaluate.");
            fillList(weaknesses, 3,
                    "Some sections can be tightened so the resume reads more clearly for ATS and recruiters.",
                    "Role alignment can be sharper by emphasizing the most relevant tools and outcomes."
            );

            List<String> improvements = new ArrayList<>();
            if (!hasSummary) improvements.add("Add a 2 to 3 line summary that states your target role, core strengths, and preferred tech stack.");
            if (!hasProjects) improvements.add("Include at least 2 project entries with the problem, your contribution, the stack, and the final result.");
            if (!hasMetrics) improvements.add("Add numbers, percentages, or delivery impact wherever possible to show measurable outcomes.");
            improvements.add("Group technical skills into clear categories such as frontend, backend, database, and tools for better ATS parsing.");
            fillList(improvements, 4,
                    "Rewrite bullets to start with strong action verbs and keep each point outcome-focused.",
                    "Tailor the top third of the resume toward one or two target roles instead of listing everything equally."
            );

            List<String> jobRoles = suggestRoles(detectedSkills, normalizedText);
            List<String> projectSuggestions = suggestProjects(detectedSkills, jobRoles);

            var root = objectMapper.createObjectNode();
            root.put("atsScore", atsScore);
            root.set("strengths", objectMapper.valueToTree(strengths.subList(0, 5)));
            root.set("weaknesses", objectMapper.valueToTree(weaknesses.subList(0, 3)));
            root.set("improvements", objectMapper.valueToTree(improvements.subList(0, 4)));
            root.set("jobRoles", objectMapper.valueToTree(jobRoles.subList(0, 5)));
            root.set("projectSuggestions", objectMapper.valueToTree(projectSuggestions.subList(0, 3)));
            root.set("quickPractice", objectMapper.valueToTree(buildQuickPractice(jobRoles, detectedSkills)));
            return objectMapper.writeValueAsString(root);
        } catch (Exception ex) {
            logger.error("Failed to build fallback resume analysis: {}", ex.getMessage());
            throw new RuntimeException("The AI service is temporarily busy, and the local fallback analysis could not be created.");
        }
    }

    private List<String> detectSkills(String text) {
        String normalizedText = normalizeText(text);
        LinkedHashSet<String> skills = new LinkedHashSet<>();

        addSkillIfPresent(skills, normalizedText, "Java", "java");
        addSkillIfPresent(skills, normalizedText, "Spring Boot", "spring boot");
        addSkillIfPresent(skills, normalizedText, "Spring", " spring ");
        addSkillIfPresent(skills, normalizedText, "React", "react");
        addSkillIfPresent(skills, normalizedText, "Next.js", "next.js", "nextjs");
        addSkillIfPresent(skills, normalizedText, "JavaScript", "javascript");
        addSkillIfPresent(skills, normalizedText, "TypeScript", "typescript");
        addSkillIfPresent(skills, normalizedText, "MySQL", "mysql");
        addSkillIfPresent(skills, normalizedText, "PostgreSQL", "postgresql", "postgres");
        addSkillIfPresent(skills, normalizedText, "MongoDB", "mongodb");
        addSkillIfPresent(skills, normalizedText, "JWT", "jwt", "json web token");
        addSkillIfPresent(skills, normalizedText, "Docker", "docker");
        addSkillIfPresent(skills, normalizedText, "AWS", "aws", "amazon web services");
        addSkillIfPresent(skills, normalizedText, "REST APIs", "rest api", "restful api", "rest apis");
        addSkillIfPresent(skills, normalizedText, "Microservices", "microservices", "microservice");
        addSkillIfPresent(skills, normalizedText, "Node.js", "node.js", "nodejs");
        addSkillIfPresent(skills, normalizedText, "Express", "express");
        addSkillIfPresent(skills, normalizedText, "Python", "python");
        addSkillIfPresent(skills, normalizedText, "HTML", "html");
        addSkillIfPresent(skills, normalizedText, "CSS", "css");
        addSkillIfPresent(skills, normalizedText, "Tailwind CSS", "tailwind");
        addSkillIfPresent(skills, normalizedText, "Git", " git ");
        addSkillIfPresent(skills, normalizedText, "Redis", "redis");

        return new ArrayList<>(skills);
    }

    private void addSkillIfPresent(LinkedHashSet<String> skills, String normalizedText, String canonical, String... aliases) {
        for (String alias : aliases) {
            if (normalizedText.contains(alias.toLowerCase(Locale.ENGLISH))) {
                skills.add(canonical);
                return;
            }
        }
    }

    private String buildFallbackInterviewQuestions(String resumeText, String resumeContext,
                                                   String candidateName, String skills,
                                                   String description, int count) {
        try {
            List<String> relevantSkills = collectRelevantSkills(skills, resumeText, description + " " + resumeContext);
            String roleFocus = suggestRoles(relevantSkills, resumeContext + " " + description).get(0);
            String displayName = hasText(candidateName) ? candidateName.trim() : "the candidate";
            int questionCount = Math.max(1, count);

            var root = objectMapper.createObjectNode();
            var questionsArray = objectMapper.createArrayNode();

            for (int i = 0; i < questionCount; i++) {
                String type = switch (i % 3) {
                    case 0 -> "TECHNICAL";
                    case 1 -> "PROJECT";
                    default -> "HR";
                };

                String skill = relevantSkills.get(i % relevantSkills.size());
                String questionText;

                if ("TECHNICAL".equals(type)) {
                    questionText = "How would you use " + skill + " to deliver reliable results in a " + roleFocus + " role?";
                } else if ("PROJECT".equals(type)) {
                    questionText = "Walk me through a project where you applied " + skill + ". What problem did " + displayName + " solve, what decisions mattered, and what was the outcome?";
                } else {
                    questionText = switch (i % 6) {
                        case 2 -> "Introduce yourself and explain why you are targeting " + roleFocus + " roles right now.";
                        case 5 -> "Tell me about a time you handled feedback, pressure, or a deadline and what you learned from it.";
                        default -> "What strengths would you highlight in an interview to show you are ready for a " + roleFocus + " position?";
                    };
                }

                var questionNode = objectMapper.createObjectNode();
                questionNode.put("question", questionText);
                questionNode.put("type", type);
                questionsArray.add(questionNode);
            }

            root.set("questions", questionsArray);
            return objectMapper.writeValueAsString(root);
        } catch (Exception ex) {
            logger.error("Failed to build fallback interview questions: {}", ex.getMessage());
            throw new RuntimeException("The AI service is temporarily busy, and fallback interview questions could not be created.");
        }
    }

    private String buildFallbackAnswerEvaluation(String question, String answer, String resumeContext) {
        try {
            int wordCount = countWords(answer);
            int sentenceCount = countSentences(answer);
            int keywordOverlap = countKeywordOverlap(question, answer);
            boolean hasNumbers = NUMBER_PATTERN.matcher(answer).find();
            boolean hasReasoning = containsAny(answer, "because", "therefore", "trade-off", "tradeoff", "for example", "for instance");

            double score = 3.8;
            if (wordCount >= 20) score += 1.0;
            if (wordCount >= 45) score += 1.2;
            if (wordCount >= 90) score += 0.8;
            if (sentenceCount >= 2) score += 0.7;
            if (keywordOverlap >= 2) score += 0.7;
            if (keywordOverlap >= 4) score += 0.5;
            if (hasNumbers) score += 0.4;
            if (hasReasoning) score += 0.7;
            if (wordCount < 15) score -= 1.2;
            score = Math.max(3.0, Math.min(8.8, score));
            score = Math.round(score * 10.0) / 10.0;

            List<String> strengths = new ArrayList<>();
            if (wordCount >= 35) strengths.add("You provided enough detail to show some understanding instead of giving only a short reply.");
            if (keywordOverlap >= 2) strengths.add("Your answer stayed relevant to the question and addressed the main topic.");
            if (hasReasoning) strengths.add("You included reasoning or explanation, which makes the answer more convincing.");
            if (hasNumbers) strengths.add("You used concrete details or results, which improves credibility.");
            fillList(strengths, 2,
                    "The response has a usable foundation that can be improved with stronger structure and a clearer example."
            );

            List<String> weaknesses = new ArrayList<>();
            if (wordCount < 40) weaknesses.add("The answer needs more depth so the interviewer can understand your thinking, actions, and outcome.");
            if (!hasNumbers) weaknesses.add("Add one concrete example, metric, or result to make the answer more believable.");
            if (sentenceCount < 2) weaknesses.add("Structure the response into a beginning, middle, and end instead of a single short statement.");
            fillList(weaknesses, 2,
                    "Make the answer more specific to your own work so it sounds less generic."
            );

            var root = objectMapper.createObjectNode();
            root.put("score", score);
            root.put("strengths", String.join(" ", strengths.subList(0, 2)));
            root.put("weaknesses", String.join(" ", weaknesses.subList(0, 2)));
            root.put("improvedAnswer", buildImprovedAnswerTemplate(question, resumeContext));
            return objectMapper.writeValueAsString(root);
        } catch (Exception ex) {
            logger.error("Failed to build fallback answer evaluation: {}", ex.getMessage());
            throw new RuntimeException("The AI service is temporarily busy, and fallback answer feedback could not be created.");
        }
    }

    private String buildImprovedAnswerTemplate(String question, String resumeContext) {
        String topic = extractPrimaryTopic(question);
        boolean behavioralQuestion = containsAny(question, "tell me about", "time you", "challenge", "deadline", "feedback", "conflict");

        if (behavioralQuestion) {
            return "A stronger answer would use a clear STAR structure: explain the situation, define your responsibility, describe the actions you personally took, and finish with the result. For this question, start with a real example related to "
                    + topic
                    + ", mention the pressure or trade-offs involved, and end with the measurable outcome and what you learned.";
        }

        String resumeHint = hasText(resumeContext) ? " Connect it back to your own work where possible." : "";
        return "A stronger answer would define the problem clearly, explain the approach step by step, mention the tools or decisions involved, and end with the testing, impact, or lesson learned. For this question, focus on "
                + topic
                + " and add one concrete example from your experience."
                + resumeHint;
    }

    private List<String> collectRelevantSkills(String explicitSkills, String resumeText, String extraContext) {
        LinkedHashSet<String> skills = new LinkedHashSet<>();
        skills.addAll(splitSkills(explicitSkills));
        skills.addAll(detectSkills(resumeText));
        skills.addAll(detectSkills(extraContext));

        if (skills.isEmpty()) {
            skills.add("problem solving");
            skills.add("system design");
            skills.add("communication");
            skills.add("debugging");
        }

        return new ArrayList<>(skills);
    }

    private List<String> splitSkills(String skillsText) {
        LinkedHashSet<String> skills = new LinkedHashSet<>();
        if (!hasText(skillsText)) {
            return new ArrayList<>();
        }

        String[] tokens = skillsText.split("[,|/;\\n]");
        for (String token : tokens) {
            String trimmed = token.trim();
            if (trimmed.length() >= 2) {
                skills.add(trimmed);
            }
        }

        return new ArrayList<>(skills);
    }

    private List<String> suggestRoles(List<String> detectedSkills, String sourceText) {
        LinkedHashSet<String> roles = new LinkedHashSet<>();
        String normalizedText = normalizeText(sourceText);

        if (containsAny(detectedSkills, "React", "Next.js", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind CSS")) {
            roles.add("Frontend Developer");
        }
        if (containsAny(detectedSkills, "Java", "Spring Boot", "Spring", "REST APIs", "JWT", "MySQL", "PostgreSQL")) {
            roles.add("Java Backend Developer");
        }
        if (containsAny(detectedSkills, "React", "Java", "Spring Boot", "MySQL", "PostgreSQL", "JWT")) {
            roles.add("Full Stack Developer");
        }
        if (containsAny(detectedSkills, "Docker", "AWS", "Microservices", "Redis")) {
            roles.add("Backend Engineer");
        }
        if (containsAny(detectedSkills, "Python")) {
            roles.add("Software Developer");
        }
        if (roles.isEmpty() && containsAny(normalizedText, "interview", "resume", "application")) {
            roles.add("Application Developer");
        }

        fillList(roles, 5,
                "Software Engineer",
                "Web Developer",
                "Application Developer",
                "Product Engineer",
                "Platform Developer"
        );

        return new ArrayList<>(roles);
    }

    private List<String> suggestProjects(List<String> detectedSkills, List<String> roles) {
        LinkedHashSet<String> suggestions = new LinkedHashSet<>();

        if (containsAny(detectedSkills, "React", "Next.js")) {
            suggestions.add("Build a responsive candidate dashboard with interview history, filters, and profile management.");
        }
        if (containsAny(detectedSkills, "Java", "Spring Boot")) {
            suggestions.add("Create a Spring Boot service with JWT authentication, audit logs, and retry-safe AI request handling.");
        }
        if (containsAny(detectedSkills, "MySQL", "PostgreSQL", "MongoDB")) {
            suggestions.add("Design a reporting module that stores session outcomes and supports searchable interview analytics.");
        }
        if (containsAny(detectedSkills, "Docker", "AWS", "Microservices")) {
            suggestions.add("Deploy a production-ready mock interview API with containerized services and environment-based configuration.");
        }

        suggestions.add("Build a role-based interview practice platform tailored for " + roles.get(0) + " candidates.");
        suggestions.add("Create a quick-practice module that generates answer drills from resume content and target roles.");
        suggestions.add("Build a searchable interview archive that helps candidates revisit answers, feedback, and progress over time.");

        return new ArrayList<>(new ArrayList<>(suggestions).subList(0, 3));
    }

    private List<JsonNode> buildQuickPractice(List<String> roles, List<String> skills) {
        List<JsonNode> items = new ArrayList<>();
        List<String> relevantSkills = skills.isEmpty() ? List.of("your strongest technical skill") : skills;

        items.add(quickPracticeItem(
                "Tell me about yourself and why you are targeting " + roles.get(0) + " roles.",
                "I would introduce my background briefly, connect it to " + roles.get(0) + " work, and explain that my strengths in " + relevantSkills.get(0) + " help me contribute quickly."
        ));
        items.add(quickPracticeItem(
                "Which skill from your resume best proves you can add value immediately?",
                "I would highlight " + relevantSkills.get(0) + " because it directly supports the kind of problems I want to solve and I can explain it with a recent project or result."
        ));
        items.add(quickPracticeItem(
                "Describe a project that demonstrates your readiness for this role.",
                "I would explain the project problem, the stack I used, the decisions I made, and the measurable result so the interviewer can see both execution and ownership."
        ));
        items.add(quickPracticeItem(
                "What is one improvement you are actively working on right now?",
                "I would identify one area I am sharpening, explain the steps I am taking, and show how that effort makes me stronger for my next opportunity."
        ));

        return items;
    }

    private JsonNode quickPracticeItem(String question, String sampleAnswer) {
        var node = objectMapper.createObjectNode();
        node.put("question", question);
        node.put("sampleAnswer", sampleAnswer);
        return node;
    }

    private String extractPrimaryTopic(String question) {
        Matcher matcher = WORD_PATTERN.matcher(normalizeText(question));
        while (matcher.find()) {
            String token = matcher.group().toLowerCase(Locale.ENGLISH);
            if (token.length() > 3 && !STOP_WORDS.contains(token)) {
                return token;
            }
        }
        return "the topic";
    }

    private static class GeminiRetryableException extends RuntimeException {
        GeminiRetryableException(String message) {
            super(message);
        }

        GeminiRetryableException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
