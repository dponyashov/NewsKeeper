package com.dponyashov.news_keeper_back.service.impl;

import com.dponyashov.news_keeper_back.config.AppConfig;
import com.dponyashov.news_keeper_back.entity.MediaFileEntity;
import com.dponyashov.news_keeper_back.enums.MediaStatus;
import com.dponyashov.news_keeper_back.repository.MediaFileRepository;
import com.dponyashov.news_keeper_back.service.MediaStorageService;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaStorageServiceImpl implements MediaStorageService {

    private final S3Client s3Client;
    private final MediaFileRepository mediaRepository;
    private final AppConfig appConfig;

    @PostConstruct
    public void initBucket() {
        try {
            ensureBucketExists();
        } catch (Exception e) {
            log.warn("S3 еще не готов при старте приложения, бакет будет проверен при первом обращении: {}", e.getMessage());
        }
        String bucket = appConfig.s3().bucket();
        try {
            s3Client.headBucket(b -> b.bucket(bucket));
        } catch (Exception e) {
            s3Client.createBucket(b -> b.bucket(bucket));
        }
    }

    private void ensureBucketExists() {
        String bucket = appConfig.s3().bucket();
        try {
            s3Client.headBucket(b -> b.bucket(bucket));
        } catch (NoSuchBucketException e) {
            s3Client.createBucket(b -> b.bucket(bucket));
        }
    }

    @Override
    @Transactional
    public MediaFileEntity uploadFile(MultipartFile file, MediaStatus initialStatus, Long newsId) {
        UUID fileId = UUID.randomUUID();
        String originalFilename = file.getOriginalFilename();
        String extension = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
        String s3Key = "news/" + fileId + extension;

        try {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(appConfig.s3().bucket())
                    .key(s3Key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            throw new RuntimeException("Ошибка при загрузке файла в S3", e);
        }

//        String baseUrl = (appConfig.s3().publicEndpoint() != null && !appConfig.s3().publicEndpoint().isBlank())
//                ? appConfig.s3().publicEndpoint()
//                : appConfig.s3().endpoint();
//        String publicUrl = String.format("%s/%s/%s", baseUrl, appConfig.s3().bucket(), s3Key);
        String publicEndpoint = appConfig.s3().publicEndpoint();
        String publicUrl;

        if (publicEndpoint != null && !publicEndpoint.isBlank()) {
            // Например: http://localhost:9000/news-media/file.jpg
            publicUrl = String.format("%s/%s/%s", publicEndpoint.replaceAll("/+$", ""), appConfig.s3().bucket(), s3Key);
        } else {
            // Относительный путь для работы через Nginx-прокси: /news-media/file.jpg
            publicUrl = String.format("/%s/%s", appConfig.s3().bucket(), s3Key);
        }

        MediaFileEntity entity = MediaFileEntity.builder()
                .id(fileId)
                .s3Key(s3Key)
                .url(publicUrl)
                .status(initialStatus)
                .newsId(newsId)
                .build();

        return mediaRepository.save(entity);
    }

    @Override
    public void deleteFromS3(String s3Key) {
        DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                .bucket(appConfig.s3().bucket())
                .key(s3Key)
                .build();
        s3Client.deleteObject(deleteRequest);
    }
}
