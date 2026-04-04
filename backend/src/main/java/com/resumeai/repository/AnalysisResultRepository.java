package com.resumeai.repository;

import com.resumeai.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {
    Optional<AnalysisResult> findByResumeId(Long resumeId);

    @Query("SELECT ar FROM AnalysisResult ar JOIN ar.resume r WHERE r.user.id = :userId ORDER BY ar.analyzedAt DESC")
    List<AnalysisResult> findByUserIdOrderByDate(Long userId);
}
