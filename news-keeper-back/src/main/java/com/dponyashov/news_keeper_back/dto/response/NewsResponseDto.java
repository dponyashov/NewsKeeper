package com.dponyashov.news_keeper_back.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Builder
public record NewsResponseDto(
        Long id,
        String title,
        String coverUrl,
        Map<String, Object> content,
        LocalDateTime createdAt
) {}