package com.dponyashov.news_keeper_back.dto.request;

import tools.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;

@Builder
public record NewsRequestDto(
        @NotBlank(message = "Заголовок обязателен") String title,
        @NotNull(message = "Контент обязателен") Map<String, Object> content
) {}