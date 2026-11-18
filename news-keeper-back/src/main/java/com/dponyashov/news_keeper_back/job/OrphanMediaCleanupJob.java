package com.dponyashov.news_keeper_back.job;

import com.dponyashov.news_keeper_back.entity.MediaFileEntity;
import com.dponyashov.news_keeper_back.enums.MediaStatus;
import com.dponyashov.news_keeper_back.repository.MediaFileRepository;
import com.dponyashov.news_keeper_back.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrphanMediaCleanupJob {

    private final MediaFileRepository mediaRepository;
    private final MediaStorageService storageService;

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupOrphanFiles() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        List<MediaFileEntity> orphans = mediaRepository
                .findAllByStatusAndCreatedAtBefore(MediaStatus.PENDING, threshold);

        for (MediaFileEntity file : orphans) {
            try {
                storageService.deleteFromS3(file.getS3Key());
                mediaRepository.delete(file);
                log.info("Удален неиспользуемый файл: {}", file.getS3Key());
            } catch (Exception e) {
                log.error("Ошибка при удалении файла из S3: {}", file.getS3Key(), e);
            }
        }
    }
}