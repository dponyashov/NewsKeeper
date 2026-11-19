-- Расширение для ускорения поиска ILIKE '%...%'
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Таблица новостей
CREATE TABLE IF NOT EXISTS t_news (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    cover_url VARCHAR(512),
    content JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрой сортировки ленты по дате публикации
CREATE INDEX IF NOT EXISTS idx_news_created_at ON t_news (created_at DESC);

-- GIN-индекс для быстрого поиска по заголовку новости
CREATE INDEX IF NOT EXISTS idx_news_title_trgm ON t_news USING gin (title gin_trgm_ops);

-- Таблица медиафайлов (связь с S3 / SeaweedFS)
CREATE TABLE IF NOT EXISTS t_media_files (
    id UUID PRIMARY KEY,
    url VARCHAR(512) NOT NULL UNIQUE,
    s3_key VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    news_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_media_news
        FOREIGN KEY (news_id)
        REFERENCES t_news (id)
        ON DELETE SET NULL
);

-- Индекс для поиска привязанных файлов новости и фоновой очистки PENDING-файлов
CREATE INDEX IF NOT EXISTS idx_media_news_id ON t_media_files (news_id);
CREATE INDEX IF NOT EXISTS idx_media_status_created ON t_media_files (status, created_at);
