package com.dponyashov.news_keeper_back.service;

import com.dponyashov.news_keeper_back.entity.MediaFileEntity;
import com.dponyashov.news_keeper_back.enums.MediaStatus;
import org.springframework.web.multipart.MultipartFile;

public interface MediaStorageService {
    MediaFileEntity uploadFile(MultipartFile file, MediaStatus initialStatus, Long newsId);
    void deleteFromS3(String s3Key);
}
