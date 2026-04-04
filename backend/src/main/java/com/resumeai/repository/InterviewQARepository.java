package com.resumeai.repository;

import com.resumeai.entity.InterviewQA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InterviewQARepository extends JpaRepository<InterviewQA, Long> {
    List<InterviewQA> findBySessionIdOrderByOrderIndex(Long sessionId);
}
