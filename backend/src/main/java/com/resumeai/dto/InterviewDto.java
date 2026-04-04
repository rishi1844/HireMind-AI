package com.resumeai.dto;

import lombok.Data;
import java.util.List;

public class InterviewDto {

    @Data
    public static class GenerateQuestionsRequest {
        private Long resumeId;
        private String name;
        private String skills;
        private String description;
        private int count = 10;
    }

    @Data
    public static class Question {
        private String question;
        private String type; // TECHNICAL, PROJECT, HR
    }

    @Data
    public static class QuestionsResponse {
        private List<Question> questions;
    }

    @Data
    public static class EvaluateAnswerRequest {
        private String question;
        private String answer;
        private String resumeContext;
    }

    @Data
    public static class EvaluationResponse {
        private Double score;
        private String strengths;
        private String weaknesses;
        private String improvedAnswer;
    }

    @Data
    public static class SaveSessionRequest {
        private Long resumeId;
        private String sessionTitle;
        private List<QAItem> qaList;
    }

    @Data
    public static class QAItem {
        private String question;
        private String questionType;
        private String answer;
        private String inputMode;
        private Double score;
        private String strengths;
        private String weaknesses;
        private String improvedAnswer;
        private Boolean skipped;
        private Integer orderIndex;
    }

    @Data
    public static class SessionResponse {
        private Long id;
        private String sessionTitle;
        private Double overallScore;
        private Integer questionsAnswered;
        private Integer questionsAsked;
        private String createdAt;
        private Long resumeId;
        private String resumeFileName;
        private List<QAItem> qaList;
    }
}
