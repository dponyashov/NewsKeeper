package com.dponyashov.news_keeper_back.dto.response;

import lombok.Builder;
import java.util.List;

@Builder
public record PageResponseDto<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {}
