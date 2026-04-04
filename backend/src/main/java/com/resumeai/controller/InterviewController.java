package com.resumeai.controller;

import com.resumeai.dto.InterviewDto;
import com.resumeai.service.InterviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class InterviewController {

    @Autowired private InterviewService interviewService;

    @PostMapping("/generate-questions")
    public ResponseEntity<InterviewDto.QuestionsResponse> generateQuestions(
            @RequestBody InterviewDto.GenerateQuestionsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        InterviewDto.QuestionsResponse response = interviewService.generateQuestions(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/evaluate-answer")
    public ResponseEntity<InterviewDto.EvaluationResponse> evaluateAnswer(
            @RequestBody InterviewDto.EvaluateAnswerRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        InterviewDto.EvaluationResponse response = interviewService.evaluateAnswer(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interview/save-session")
    public ResponseEntity<InterviewDto.SessionResponse> saveSession(
            @RequestBody InterviewDto.SaveSessionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        InterviewDto.SessionResponse response = interviewService.saveSession(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/interview/history")
    public ResponseEntity<List<InterviewDto.SessionResponse>> getSessionHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<InterviewDto.SessionResponse> sessions = interviewService.getSessionHistory(userDetails.getUsername());
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/interview/session/{sessionId}")
    public ResponseEntity<InterviewDto.SessionResponse> getSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        InterviewDto.SessionResponse session = interviewService.getSessionById(sessionId, userDetails.getUsername());
        return ResponseEntity.ok(session);
    }

    @DeleteMapping("/interview/session/{sessionId}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        interviewService.deleteSession(sessionId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
