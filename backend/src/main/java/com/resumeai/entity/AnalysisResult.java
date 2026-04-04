package com.resumeai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_results")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Column(name = "ats_score")
    private Integer atsScore;

    @Column(columnDefinition = "JSON")
    private String strengths;

    @Column(columnDefinition = "JSON")
    private String weaknesses;

    @Column(columnDefinition = "JSON")
    private String improvements;

    @Column(name = "job_roles", columnDefinition = "JSON")
    private String jobRoles;

    @Column(name = "project_suggestions", columnDefinition = "JSON")
    private String projectSuggestions;

    @Column(name = "quick_practice_qa", columnDefinition = "JSON")
    private String quickPracticeQa;

    @Column(name = "raw_analysis", columnDefinition = "LONGTEXT")
    private String rawAnalysis;

    @Column(name = "analyzed_at", updatable = false)
    private LocalDateTime analyzedAt;

    @PrePersist
    protected void onCreate() {
        analyzedAt = LocalDateTime.now();
    }
}
