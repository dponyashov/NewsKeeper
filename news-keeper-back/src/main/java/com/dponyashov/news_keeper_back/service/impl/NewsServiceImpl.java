package com.dponyashov.news_keeper_back.service.impl;

import com.dponyashov.news_keeper_back.dto.request.NewsRequestDto;
import com.dponyashov.news_keeper_back.dto.response.NewsResponseDto;
import com.dponyashov.news_keeper_back.dto.response.PageResponseDto;
import com.dponyashov.news_keeper_back.entity.MediaFileEntity;
import com.dponyashov.news_keeper_back.entity.NewsEntity;
import com.dponyashov.news_keeper_back.enums.MediaStatus;
import com.dponyashov.news_keeper_back.repository.MediaFileRepository;
import com.dponyashov.news_keeper_back.repository.NewsRepository;
import com.dponyashov.news_keeper_back.service.MediaStorageService;
import com.dponyashov.news_keeper_back.service.NewsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NewsServiceImpl implements NewsService {

    private final NewsRepository newsRepository;
    private final MediaFileRepository mediaRepository;
    private final MediaStorageService storageService;

    @Transactional(readOnly = true)
    @Override
    public Page<NewsResponseDto> getNewsPage(String search, Pageable pageable) {
        Page<NewsEntity> page;
        if (search != null && !search.isBlank()) {
            page = newsRepository.findByTitleContainingIgnoreCase(search.trim(), pageable);
        } else {
            page = newsRepository.findAll(pageable);
        }
        return page.map(this::mapToListItemDto);
    }

    @Transactional(readOnly = true)
    @Override
    public PageResponseDto<NewsResponseDto> getNewsPage(String query, int page, int size) {
        String cleanQuery = (query != null) ? query.trim() : "";
        // В нативном запросе используем имя колонки БД: created_at
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "created_at"));

        Page<NewsEntity> newsPage = newsRepository.searchNews(cleanQuery, pageable);

        List<NewsResponseDto> items = newsPage.getContent()
                .stream()
                .map(this::mapToListItemDto)
                .toList();

        return PageResponseDto.<NewsResponseDto>builder()
                .content(items)
                .page(newsPage.getNumber())
                .size(newsPage.getSize())
                .totalElements(newsPage.getTotalElements())
                .totalPages(newsPage.getTotalPages())
                .last(newsPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    @Override
    public List<NewsResponseDto> getAllNews() {
        return newsRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::mapToListItemDto)
                .toList();
    }

    @Transactional
    @Override
    public NewsResponseDto createNews(NewsRequestDto dto, MultipartFile coverImage) {
        NewsEntity entity = NewsEntity.builder()
                .title(dto.title())
                .content(dto.content())
                .build();

        // Сначала сохраняем новость, чтобы получить её ID
        NewsEntity saved = newsRepository.save(entity);

        // Загружаем обложку, если она передана
        if (coverImage != null && !coverImage.isEmpty()) {
            MediaFileEntity coverMedia = storageService.uploadFile(
                    coverImage, MediaStatus.ATTACHED, saved.getId()
            );
            saved.setCoverUrl(coverMedia.getUrl());
        }

        // Привязываем картинки, вставленные внутри JSON-текста
        syncContentMedia(saved.getId(), saved.getContent(), saved.getCoverUrl());

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public NewsResponseDto getNews(Long id) {
        NewsEntity entity = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Новость не найдена"));
        return mapToDto(entity);
    }
    // Добавьте эти методы в NewsService.java

    @Transactional
    @Override
    public NewsResponseDto updateNews(Long id, NewsRequestDto dto, MultipartFile newCoverImage, boolean removeCover) {
        NewsEntity entity = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Новость не найдена: " + id));

        entity.setTitle(dto.title());
        entity.setContent(dto.content());

        if (newCoverImage != null && !newCoverImage.isEmpty()) {
            // Загружаем новую обложку
            MediaFileEntity coverMedia = storageService.uploadFile(
                    newCoverImage, MediaStatus.ATTACHED, entity.getId()
            );
            entity.setCoverUrl(coverMedia.getUrl());
        } else if (removeCover) {
            // Если пользователь нажал «Удалить обложку» и не загрузил новую
            entity.setCoverUrl(null);
        }

        // Синхронизируем медиа: удаленные из текста картинки и старая обложка перейдут в PENDING
        syncContentMedia(entity.getId(), entity.getContent(), entity.getCoverUrl());

        NewsEntity updated = newsRepository.save(entity);
        return mapToDetailDto(updated);
    }

    @Transactional
    @Override
    public void deleteNews(Long id) {
        if (!newsRepository.existsById(id)) {
            throw new RuntimeException("Новость не найдена: " + id);
        }

        // Переводим все медиафайлы этой новости в статус PENDING перед удалением новости
        List<MediaFileEntity> attachedMedia = mediaRepository.findAllByNewsId(id);
        for (MediaFileEntity media : attachedMedia) {
            media.setStatus(MediaStatus.PENDING);
            media.setNewsId(null);
        }

        newsRepository.deleteById(id);
    }

    private void syncContentMedia(Long newsId, Map<String, Object> content, String coverUrl) {
        Set<String> activeUrls = new HashSet<>();
        if (coverUrl != null) {
            activeUrls.add(coverUrl);
        }
        extractImageUrls(content, activeUrls);

        List<MediaFileEntity> previouslyAttached = mediaRepository.findAllByNewsId(newsId);
        for (MediaFileEntity media : previouslyAttached) {
            if (!activeUrls.contains(media.getUrl())) {
                media.setStatus(MediaStatus.PENDING);
                media.setNewsId(null);
            }
        }

        if (!activeUrls.isEmpty()) {
            List<MediaFileEntity> toAttach = mediaRepository.findAllByUrlIn(activeUrls);
            for (MediaFileEntity media : toAttach) {
                media.setStatus(MediaStatus.ATTACHED);
                media.setNewsId(newsId);
            }
        }
    }

    private void extractImageUrls(Object node, Set<String> urls) {
        if (node instanceof Map<?, ?> map) {
            if ("image".equals(map.get("type")) && map.get("attrs") instanceof Map<?, ?> attrs) {
                Object src = attrs.get("src");
                if (src instanceof String url) {
                    urls.add(url);
                }
            }
            for (Object value : map.values()) {
                extractImageUrls(value, urls);
            }
        } else if (node instanceof Iterable<?> list) {
            for (Object item : list) {
                extractImageUrls(item, urls);
            }
        }
    }

    private NewsResponseDto mapToDto(NewsEntity entity) {
        return new NewsResponseDto(
                entity.getId(),
                entity.getTitle(),
                entity.getCoverUrl(),
                entity.getContent(),
                entity.getCreatedAt()
        );
    }

    // Для списка (без тяжелого JSON-контента)
    private NewsResponseDto mapToListItemDto(NewsEntity entity) {
        return NewsResponseDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .coverUrl(entity.getCoverUrl())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    // Для детальной страницы (с полным JSON-контентом)
    private NewsResponseDto mapToDetailDto(NewsEntity entity) {
        return NewsResponseDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .coverUrl(entity.getCoverUrl())
                .content(entity.getContent())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
