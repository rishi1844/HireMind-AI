package com.resumeai.controller;

import com.resumeai.dto.ResumeDto;
import com.resumeai.service.ResumeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ResumeController {

    @Autowired private ResumeService resumeService;

    @PostMapping("/upload-resume")
    public ResponseEntity<ResumeDto.ResumeResponse> uploadResume(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) throws Exception {
        ResumeDto.ResumeResponse response = resumeService.uploadResume(file, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/analyze")
    public ResponseEntity<ResumeDto.AnalysisResponse> analyzeResume(
            @RequestParam("resumeId") Long resumeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ResumeDto.AnalysisResponse response = resumeService.analyzeResume(resumeId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/analysis/{analysisId}")
    public ResponseEntity<ResumeDto.AnalysisResponse> getAnalysis(
            @PathVariable Long analysisId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ResumeDto.AnalysisResponse response = resumeService.getAnalysisById(analysisId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<ResumeDto.HistoryItem>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ResumeDto.HistoryItem> history = resumeService.getHistory(userDetails.getUsername());
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/history/{resumeId}")
    public ResponseEntity<Void> deleteResume(
            @PathVariable Long resumeId,
            @AuthenticationPrincipal UserDetails userDetails) {
        resumeService.deleteResume(resumeId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
