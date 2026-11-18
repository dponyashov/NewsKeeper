package com.dponyashov.news_keeper_back.service;

import com.dponyashov.news_keeper_back.dto.request.NewsRequestDto;
import com.dponyashov.news_keeper_back.dto.response.NewsResponseDto;
import com.dponyashov.news_keeper_back.dto.response.PageResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface NewsService {
    Page<NewsResponseDto> getNewsPage(String search, Pageable pageable);

    List<NewsResponseDto> getAllNews();

    NewsResponseDto createNews(NewsRequestDto dto, MultipartFile coverImage);

    NewsResponseDto getNews(Long id);

    NewsResponseDto updateNews(Long id, NewsRequestDto dto, MultipartFile newCoverImage, boolean removeCover);

    void deleteNews(Long id);

    PageResponseDto<NewsResponseDto> getNewsPage(String search, int page, int size);
}