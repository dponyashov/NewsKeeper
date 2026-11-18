package com.dponyashov.news_keeper_back.repository;

import com.dponyashov.news_keeper_back.entity.MediaFileEntity;
import com.dponyashov.news_keeper_back.enums.MediaStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface MediaFileRepository extends JpaRepository<MediaFileEntity, UUID> {
    List<MediaFileEntity> findAllByNewsId(Long newsId);
    List<MediaFileEntity> findAllByUrlIn(Collection<String> urls);
    List<MediaFileEntity> findAllByStatusAndCreatedAtBefore(MediaStatus status, LocalDateTime threshold);
}
