package com.dponyashov.news_keeper_back.controller;

import com.dponyashov.news_keeper_back.dto.request.NewsRequestDto;
import com.dponyashov.news_keeper_back.dto.response.NewsResponseDto;
import com.dponyashov.news_keeper_back.dto.response.PageResponseDto;
import com.dponyashov.news_keeper_back.entity.MediaFileEntity;
import com.dponyashov.news_keeper_back.enums.MediaStatus;
import com.dponyashov.news_keeper_back.service.MediaStorageService;
import com.dponyashov.news_keeper_back.service.NewsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("api/v1")
@RequiredArgsConstructor
//@CrossOrigin(origins = "http://localhost:5174") // Разрешаем запросы с Vite
public class NewsController {

    private final NewsService newsService;
    private final MediaStorageService storageService;

//    @GetMapping("/news")
//    public List<NewsResponseDto> getAllNews() {
//        return newsService.getAllNews();
//    }

//    @GetMapping("/news")
//    public Page<NewsResponseDto> getAllNews(
//            @RequestParam(value = "search", required = false) String search,
//            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
//    ) {
//        return newsService.getNewsPage(search, pageable);
//    }

    @GetMapping("/news")
    public PageResponseDto<NewsResponseDto> getNewsList(
            @RequestParam(value = "search", required = false, defaultValue = "") String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "5") int size
    ) {
        return newsService.getNewsPage(search, page, size);
    }

    // 1. Загрузка картинки внутрь текста редактора
    @PostMapping(value = "/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> uploadEditorImage(@RequestParam("file") MultipartFile file) {
        MediaFileEntity media = storageService.uploadFile(file, MediaStatus.PENDING, null);
        return Map.of("url", media.getUrl());
    }

    // 2. Создание новости вместе с обложкой и JSON-контентом
    @PostMapping(value = "/news" ,consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public NewsResponseDto createNews(
            @RequestPart("news") @Valid NewsRequestDto dto,
            @RequestPart(value = "file", required = false) MultipartFile coverImage
    ) {
        return newsService.createNews(dto, coverImage);
    }

    // 3. Получение новости
    @GetMapping("/news/{id}")
    public NewsResponseDto getNews(@PathVariable Long id) {
        return newsService.getNews(id);
    }

    @PutMapping(value = "/news/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public NewsResponseDto updateNews(
            @PathVariable Long id,
            @RequestPart("news") @Valid NewsRequestDto dto,
            @RequestPart(value = "file", required = false) MultipartFile coverImage,
            @RequestParam(value = "removeCover", defaultValue = "false") boolean removeCover
    ) {
        return newsService.updateNews(id, dto, coverImage, removeCover);
    }

    @DeleteMapping("/news/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNews(@PathVariable Long id) {
        newsService.deleteNews(id);
    }
}