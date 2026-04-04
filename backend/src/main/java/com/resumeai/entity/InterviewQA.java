package com.resumeai.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "interview_qa")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InterviewQA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(name = "question_type", length = 50)
    private String questionType;

    @Column(columnDefinition = "TEXT")
    private String answer;

    @Column(name = "input_mode", length = 20)
    private String inputMode;

    @Column(name = "score")
    private Double score;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String weaknesses;

    @Column(name = "improved_answer", columnDefinition = "TEXT")
    private String improvedAnswer;

    @Column(name = "is_skipped")
    private Boolean skipped;

    @Column(name = "order_index")
    private Integer orderIndex;
}
