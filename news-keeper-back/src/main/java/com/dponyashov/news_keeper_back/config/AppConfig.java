package com.dponyashov.news_keeper_back.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated // Заставит приложение упасть с понятной ошибкой, если что-то пойдет не так
@ConfigurationProperties(prefix = "app.variables")
@Log4j2
public record AppConfig(
        String nodeEnv,
        String frontUrl,

        @Valid // Каскадная валидация обязательна в Spring Boot 3.4+ / 4.x для рекордов
        @NotNull
        @DefaultValue // Инструктирует Spring создать пустой объект с дефолтными примитивами, если ветки нет в YAML
        Jwt jwt,

        @Valid // Каскадная валидация обязательна в Spring Boot 3.4+ / 4.x для рекордов
        @NotNull
        @DefaultValue // Инструктирует Spring создать пустой объект с дефолтными примитивами, если ветки нет в YAML
        S3 s3
) {
    // Компактный конструктор (без параметров)
    public AppConfig {
        log.info("=== Инициализация конфигурации приложения ===");
        log.info("Node Env: {}", nodeEnv);
        log.info("Front URLs: {}", frontUrl);
        if (jwt != null && jwt.atSecretKey() != null && jwt.atSecretKey().length() >= 4) {
            log.info("JWT Secret prefix: {}... (len={})", jwt.atSecretKey().substring(0, 4), jwt.atSecretKey().length());
        }
        log.info("=============================================");
    }

    public record Jwt(
            String atSecretKey,
            String rtSecretKey,
            Long atExpiration,
            Long rtExpiration
    ) {}

    public record S3(
            String endpoint,
            String publicEndpoint,
            String accessKey,
            String secretKey,
            String bucket,
            String region
    ) {}
}