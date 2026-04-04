package com.resumeai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "interview_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @Column(name = "resume_file_name", length = 255)
    private String resumeFileNameSnapshot;

    @Column(name = "session_title")
    private String sessionTitle;

    @Column(name = "overall_score")
    private Double overallScore;

    @Column(name = "questions_answered")
    private Integer questionsAnswered;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<InterviewQA> qaList;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
