package com.resumeai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.dto.ResumeDto;
import com.resumeai.entity.*;
import com.resumeai.repository.*;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ResumeService {

    private static final Logger logger = LoggerFactory.getLogger(ResumeService.class);

    @Autowired private ResumeRepository resumeRepository;
    @Autowired private AnalysisResultRepository analysisResultRepository;
    @Autowired private InterviewSessionRepository interviewSessionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private GeminiService geminiService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeDto.ResumeResponse uploadResume(MultipartFile file, String userEmail) throws IOException {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String extractedText = extractTextFromPdf(file);

        Resume resume = Resume.builder()
                .user(user)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .extractedText(extractedText)
                .build();

        resume = resumeRepository.save(resume);

        ResumeDto.ResumeResponse response = new ResumeDto.ResumeResponse();
        response.setId(resume.getId());
        response.setFileName(resume.getFileName());
        response.setFileSize(resume.getFileSize());
        response.setUploadedAt(resume.getUploadedAt().toString());
        response.setHasAnalysis(false);
        return response;
    }

    private String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    public ResumeDto.AnalysisResponse analyzeResume(Long resumeId, String userEmail) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        if (!resume.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized access to resume");
        }

        // Check if analysis already exists
        Optional<AnalysisResult> existing = analysisResultRepository.findByResumeId(resumeId);
        if (existing.isPresent()) {
            return mapToAnalysisResponse(existing.get(), resume);
        }

        String aiResponse = geminiService.analyzeResume(resume.getExtractedText());
        AnalysisResult result = parseAndSaveAnalysis(aiResponse, resume);
        return mapToAnalysisResponse(result, resume);
    }

    private AnalysisResult parseAndSaveAnalysis(String aiResponse, Resume resume) {
        try {
            String cleanJson = aiResponse.trim();
            if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.replaceAll("```json\\n?", "").replaceAll("```\\n?", "").trim();
            }

            JsonNode node = objectMapper.readTree(cleanJson);

            AnalysisResult result = AnalysisResult.builder()
                    .resume(resume)
                    .atsScore(node.path("atsScore").asInt())
                    .strengths(objectMapper.writeValueAsString(node.path("strengths")))
                    .weaknesses(objectMapper.writeValueAsString(node.path("weaknesses")))
                    .improvements(objectMapper.writeValueAsString(node.path("improvements")))
                    .jobRoles(objectMapper.writeValueAsString(node.path("jobRoles")))
                    .projectSuggestions(objectMapper.writeValueAsString(node.path("projectSuggestions")))
                    .quickPracticeQa(objectMapper.writeValueAsString(node.path("quickPractice")))
                    .rawAnalysis(aiResponse)
                    .build();

            return analysisResultRepository.save(result);
        } catch (Exception e) {
            logger.error("Error parsing AI analysis response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse AI analysis: " + e.getMessage());
        }
    }

    private ResumeDto.AnalysisResponse mapToAnalysisResponse(AnalysisResult result, Resume resume) {
        ResumeDto.AnalysisResponse response = new ResumeDto.AnalysisResponse();
        response.setId(result.getId());
        response.setResumeId(resume.getId());
        response.setFileName(resume.getFileName());
        response.setAtsScore(result.getAtsScore());
        response.setAnalyzedAt(result.getAnalyzedAt().toString());

        try {
            response.setStrengths(objectMapper.readValue(result.getStrengths(), new TypeReference<>() {}));
            response.setWeaknesses(objectMapper.readValue(result.getWeaknesses(), new TypeReference<>() {}));
            response.setImprovements(objectMapper.readValue(result.getImprovements(), new TypeReference<>() {}));
            response.setJobRoles(objectMapper.readValue(result.getJobRoles(), new TypeReference<>() {}));
            response.setProjectSuggestions(objectMapper.readValue(result.getProjectSuggestions(), new TypeReference<>() {}));
            if (result.getQuickPracticeQa() != null && !result.getQuickPracticeQa().isBlank()) {
                response.setQuickPractice(objectMapper.readValue(result.getQuickPracticeQa(), new TypeReference<>() {}));
            }
        } catch (Exception e) {
            logger.error("Error deserializing analysis fields: {}", e.getMessage());
        }

        if (response.getQuickPractice() == null || response.getQuickPractice().isEmpty()) {
            response.setQuickPractice(buildQuickPracticeFallback(response));
        }

        return response;
    }

    private List<ResumeDto.QuickPracticeItem> buildQuickPracticeFallback(ResumeDto.AnalysisResponse response) {
        List<ResumeDto.QuickPracticeItem> items = new ArrayList<>();

        String primaryRole = firstOrDefault(response.getJobRoles(), "your target role");
        String topStrength = firstOrDefault(response.getStrengths(), "your strongest professional skill");
        String topImprovement = firstOrDefault(response.getImprovements(), "how you are improving your resume and communication");
        String topProject = firstOrDefault(response.getProjectSuggestions(), "a project that demonstrates your technical depth");

        items.add(practiceItem(
                "Tell me about yourself and why you are targeting " + primaryRole + ".",
                "I am focused on " + primaryRole + " roles because my background aligns with the work and I can bring immediate value through " + topStrength + "."
        ));
        items.add(practiceItem(
                "Which strength from your resume would help you stand out in your next role?",
                "One of my strongest advantages is " + topStrength + ", because it helps me contribute quickly and solve practical problems with confidence."
        ));
        items.add(practiceItem(
                "How would you describe a project that proves your readiness for " + primaryRole + "?",
                "I would highlight " + topProject + " and explain the problem, the decisions I made, and the measurable result it created."
        ));
        items.add(practiceItem(
                "What improvement are you actively working on right now?",
                "I am improving " + topImprovement + ", and I am taking a structured approach so my next interview answers are clearer and more outcome-focused."
        ));

        return items;
    }

    private ResumeDto.QuickPracticeItem practiceItem(String question, String sampleAnswer) {
        ResumeDto.QuickPracticeItem item = new ResumeDto.QuickPracticeItem();
        item.setQuestion(question);
        item.setSampleAnswer(sampleAnswer);
        return item;
    }

    private String firstOrDefault(List<String> items, String fallback) {
        if (items == null || items.isEmpty() || items.get(0) == null || items.get(0).isBlank()) {
            return fallback;
        }
        return items.get(0);
    }

    public List<ResumeDto.HistoryItem> getHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Resume> resumes = resumeRepository.findByUserIdOrderByUploadedAtDesc(user.getId());

        return resumes.stream().map(resume -> {
            ResumeDto.HistoryItem item = new ResumeDto.HistoryItem();
            item.setResumeId(resume.getId());
            item.setFileName(resume.getFileName());
            item.setUploadedAt(resume.getUploadedAt().toString());

            analysisResultRepository.findByResumeId(resume.getId()).ifPresent(analysis -> {
                item.setAnalysisId(analysis.getId());
                item.setAtsScore(analysis.getAtsScore());
                item.setAnalyzedAt(analysis.getAnalyzedAt().toString());
            });
            return item;
        }).collect(Collectors.toList());
    }

    public ResumeDto.AnalysisResponse getAnalysisById(Long analysisId, String userEmail) {
        AnalysisResult result = analysisResultRepository.findById(analysisId)
                .orElseThrow(() -> new RuntimeException("Analysis not found"));

        if (!result.getResume().getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }
        return mapToAnalysisResponse(result, result.getResume());
    }

    @Transactional
    public void deleteResume(Long resumeId, String userEmail) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        if (!resume.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized access to resume");
        }

        List<InterviewSession> linkedSessions = interviewSessionRepository.findByResumeId(resumeId);
        for (InterviewSession session : linkedSessions) {
            if (session.getResumeFileNameSnapshot() == null || session.getResumeFileNameSnapshot().isBlank()) {
                session.setResumeFileNameSnapshot(resume.getFileName());
            }
            session.setResume(null);
        }
        if (!linkedSessions.isEmpty()) {
            interviewSessionRepository.saveAll(linkedSessions);
        }

        analysisResultRepository.findByResumeId(resumeId).ifPresent(analysisResultRepository::delete);
        resumeRepository.delete(resume);
    }
}
