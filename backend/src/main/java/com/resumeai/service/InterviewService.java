package com.resumeai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.dto.InterviewDto;
import com.resumeai.entity.*;
import com.resumeai.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class InterviewService {

    private static final Logger logger = LoggerFactory.getLogger(InterviewService.class);

    @Autowired private InterviewSessionRepository sessionRepository;
    @Autowired private InterviewQARepository interviewQARepository;
    @Autowired private ResumeRepository resumeRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AnalysisResultRepository analysisResultRepository;
    @Autowired private GeminiService geminiService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public InterviewDto.QuestionsResponse generateQuestions(InterviewDto.GenerateQuestionsRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Resume resume = null;
        String resumeText = "";
        String resumeContext = "No resume context available.";

        if (request.getResumeId() != null && request.getResumeId() > 0) {
            resume = resumeRepository.findById(request.getResumeId())
                    .orElseThrow(() -> new RuntimeException("Resume not found"));

            if (!resume.getUser().getEmail().equals(userEmail)) {
                throw new RuntimeException("Unauthorized");
            }

            resumeText = safeText(resume.getExtractedText());
            resumeContext = buildResumeSummary(resume);
        }

        String aiResponse = geminiService.generateInterviewQuestions(
                resumeText,
                resumeContext,
                hasText(request.getName()) ? request.getName().trim() : user.getName(),
                hasText(request.getSkills()) ? request.getSkills().trim() : "Not provided",
                hasText(request.getDescription()) ? request.getDescription().trim() : "General interview preparation session",
                request.getCount() > 0 ? request.getCount() : 10
        );
        return parseQuestionsResponse(aiResponse);
    }

    private String buildResumeSummary(Resume resume) {
        StringBuilder summary = new StringBuilder();
        summary.append("Candidate resume summary:\n");

        analysisResultRepository.findByResumeId(resume.getId()).ifPresentOrElse(result -> {
            try {
                JsonNode strengthsNode = objectMapper.readTree(result.getStrengths());
                JsonNode weaknessesNode = objectMapper.readTree(result.getWeaknesses());
                JsonNode rolesNode = objectMapper.readTree(result.getJobRoles());
                JsonNode projectsNode = objectMapper.readTree(result.getProjectSuggestions());

                summary.append("- ATS score: ").append(result.getAtsScore()).append("\n");

                if (rolesNode.isArray() && rolesNode.size() > 0) {
                    List<String> roles = new ArrayList<>();
                    rolesNode.forEach(node -> roles.add(node.asText()));
                    summary.append("- target roles: ").append(String.join(", ", roles)).append("\n");
                }
                if (projectsNode.isArray() && projectsNode.size() > 0) {
                    List<String> projects = new ArrayList<>();
                    projectsNode.forEach(node -> projects.add(node.asText()));
                    summary.append("- suggested projects: ").append(String.join(", ", projects)).append("\n");
                }
                if (strengthsNode.isArray() && strengthsNode.size() > 0) {
                    List<String> strengths = new ArrayList<>();
                    strengthsNode.forEach(node -> strengths.add(node.asText()));
                    summary.append("- strengths: ").append(String.join(", ", strengths)).append("\n");
                }
                if (weaknessesNode.isArray() && weaknessesNode.size() > 0) {
                    List<String> weaknesses = new ArrayList<>();
                    weaknessesNode.forEach(node -> weaknesses.add(node.asText()));
                    summary.append("- weaknesses: ").append(String.join(", ", weaknesses)).append("\n");
                }
            } catch (Exception ignored) {
                summary.append("- resume contains key skills and project details.\n");
            }
        }, () -> summary.append("- resume contains key skills and project details.\n"));

        return summary.toString();
    }

    private InterviewDto.QuestionsResponse parseQuestionsResponse(String aiResponse) {
        try {
            String cleanJson = aiResponse.trim()
                    .replaceAll("```json\\n?", "")
                    .replaceAll("```\\n?", "")
                    .trim();

            JsonNode node = objectMapper.readTree(cleanJson);
            JsonNode questionsNode = node.path("questions");

            List<InterviewDto.Question> questions = new ArrayList<>();
            for (JsonNode q : questionsNode) {
                InterviewDto.Question question = new InterviewDto.Question();
                question.setQuestion(q.path("question").asText());
                question.setType(q.path("type").asText("TECHNICAL"));
                questions.add(question);
            }

            InterviewDto.QuestionsResponse response = new InterviewDto.QuestionsResponse();
            response.setQuestions(questions);
            return response;
        } catch (Exception e) {
            logger.error("Error parsing questions response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse AI questions: " + e.getMessage());
        }
    }

    public InterviewDto.EvaluationResponse evaluateAnswer(InterviewDto.EvaluateAnswerRequest request, String userEmail) {
        String aiResponse = geminiService.evaluateAnswer(
                request.getQuestion(),
                request.getAnswer(),
                request.getResumeContext() != null ? request.getResumeContext() : ""
        );
        return parseEvaluationResponse(aiResponse);
    }

    private InterviewDto.EvaluationResponse parseEvaluationResponse(String aiResponse) {
        try {
            String cleanJson = aiResponse.trim()
                    .replaceAll("```json\\n?", "")
                    .replaceAll("```\\n?", "")
                    .trim();

            JsonNode node = objectMapper.readTree(cleanJson);

            InterviewDto.EvaluationResponse response = new InterviewDto.EvaluationResponse();
            response.setScore(node.path("score").asDouble());
            response.setStrengths(node.path("strengths").asText());
            response.setWeaknesses(node.path("weaknesses").asText());
            response.setImprovedAnswer(node.path("improvedAnswer").asText());
            return response;
        } catch (Exception e) {
            logger.error("Error parsing evaluation response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse AI evaluation: " + e.getMessage());
        }
    }

    public InterviewDto.SessionResponse saveSession(InterviewDto.SaveSessionRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Resume resume = null;
        if (request.getResumeId() != null) {
            resume = resumeRepository.findById(request.getResumeId())
                    .orElseThrow(() -> new RuntimeException("Resume not found"));

            if (!resume.getUser().getEmail().equals(userEmail)) {
                throw new RuntimeException("Unauthorized");
            }
        }

        double totalScore = request.getQaList().stream()
                .filter(qa -> !Boolean.TRUE.equals(qa.getSkipped()))
                .filter(qa -> qa.getScore() != null)
                .mapToDouble(InterviewDto.QAItem::getScore)
                .average()
                .orElse(0.0);

        int questionsAnswered = (int) request.getQaList().stream()
                .filter(qa -> !Boolean.TRUE.equals(qa.getSkipped()))
                .filter(qa -> hasText(qa.getAnswer()))
                .count();

        InterviewSession session = InterviewSession.builder()
                .user(user)
                .resume(resume)
                .resumeFileNameSnapshot(resume != null ? resume.getFileName() : null)
                .sessionTitle(hasText(request.getSessionTitle()) ? request.getSessionTitle().trim() : "Interview Session")
                .overallScore(totalScore)
                .questionsAnswered(questionsAnswered)
                .build();

        session = sessionRepository.save(session);

        final InterviewSession savedSession = session;
        List<InterviewQA> qaEntities = new ArrayList<>();
        for (int i = 0; i < request.getQaList().size(); i++) {
            InterviewDto.QAItem item = request.getQaList().get(i);
            InterviewQA qa = InterviewQA.builder()
                    .session(savedSession)
                    .question(item.getQuestion())
                    .questionType(item.getQuestionType())
                    .answer(item.getAnswer())
                    .inputMode(item.getInputMode())
                    .score(item.getScore())
                    .strengths(item.getStrengths())
                    .weaknesses(item.getWeaknesses())
                    .improvedAnswer(item.getImprovedAnswer())
                    .skipped(Boolean.TRUE.equals(item.getSkipped()))
                    .orderIndex(i)
                    .build();
            qaEntities.add(qa);
        }
        session.setQaList(qaEntities);
        session = sessionRepository.save(session);

        return mapToSessionResponse(session);
    }

    public List<InterviewDto.SessionResponse> getSessionHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return sessionRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToSessionResponse)
                .collect(Collectors.toList());
    }

    public InterviewDto.SessionResponse getSessionById(Long sessionId, String userEmail) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        return mapToSessionResponse(session);
    }

    private InterviewDto.SessionResponse mapToSessionResponse(InterviewSession session) {
        InterviewDto.SessionResponse response = new InterviewDto.SessionResponse();
        response.setId(session.getId());
        response.setSessionTitle(session.getSessionTitle());
        response.setOverallScore(session.getOverallScore());
        response.setQuestionsAnswered(session.getQuestionsAnswered());
        response.setCreatedAt(session.getCreatedAt().toString());

        if (session.getResume() != null) {
            response.setResumeId(session.getResume().getId());
        }

        response.setResumeFileName(
                hasText(session.getResumeFileNameSnapshot())
                        ? session.getResumeFileNameSnapshot()
                        : session.getResume() != null ? session.getResume().getFileName() : null
        );

        List<InterviewQA> qaList = session.getId() == null
                ? Collections.emptyList()
                : interviewQARepository.findBySessionIdOrderByOrderIndex(session.getId());

        response.setQuestionsAsked(qaList.size());

        List<InterviewDto.QAItem> qaItems = qaList.stream().map(qa -> {
            InterviewDto.QAItem item = new InterviewDto.QAItem();
            item.setQuestion(qa.getQuestion());
            item.setQuestionType(qa.getQuestionType());
            item.setAnswer(qa.getAnswer());
            item.setInputMode(qa.getInputMode());
            item.setScore(qa.getScore());
            item.setStrengths(qa.getStrengths());
            item.setWeaknesses(qa.getWeaknesses());
            item.setImprovedAnswer(qa.getImprovedAnswer());
            item.setSkipped(Boolean.TRUE.equals(qa.getSkipped()));
            item.setOrderIndex(qa.getOrderIndex());
            return item;
        }).collect(Collectors.toList());
        response.setQaList(qaItems);

        return response;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }

    @Transactional
    public void deleteSession(Long sessionId, String userEmail) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        sessionRepository.delete(session);
    }
}
