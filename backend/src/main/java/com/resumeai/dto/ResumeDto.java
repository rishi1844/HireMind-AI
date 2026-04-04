package com.resumeai.dto;

import lombok.Data;
import java.util.List;

public class ResumeDto {

    @Data
    public static class ResumeResponse {
        private Long id;
        private String fileName;
        private Long fileSize;
        private String uploadedAt;
        private boolean hasAnalysis;
    }

    @Data
    public static class AnalysisRequest {
        private Long resumeId;
        private String resumeText;
    }

    @Data
    public static class AnalysisResponse {
        private Long id;
        private Long resumeId;
        private String fileName;
        private Integer atsScore;
        private List<String> strengths;
        private List<String> weaknesses;
        private List<String> improvements;
        private List<String> jobRoles;
        private List<String> projectSuggestions;
        private List<QuickPracticeItem> quickPractice;
        private String analyzedAt;
    }

    @Data
    public static class QuickPracticeItem {
        private String question;
        private String sampleAnswer;
    }

    @Data
    public static class HistoryItem {
        private Long resumeId;
        private String fileName;
        private String uploadedAt;
        private Long analysisId;
        private Integer atsScore;
        private String analyzedAt;
    }
}
