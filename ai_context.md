# AI Context: NewsKeeper (Fullstack News Platform)

Этот документ содержит актуальный архитектурный контекст, технические решения и правила разработки проекта **NewsKeeper** для быстрого погружения ИИ-ассистента в новых сессиях.

---

## 1. Технологический стек и инфраструктура

- **База данных:** PostgreSQL 17 (`postgres:17-alpine`), хранение структуры статей в колонке типа `jsonb`.
- **Объектное хранилище (S3):** SeaweedFS (`chrislusf/seaweedfs:latest`), S3 API на внутреннем порту `8333` (проброшен на `9000` хоста).
- **Бэкенд:** Java 21+, Spring Boot 4.1 (Spring Web, Spring Data JPA / Hibernate 7, Spring Security, Validation, Lombok, AWS SDK for Java v2 `2.29.0`, JJWT `0.12.6`).
- **Фронтенд:** React 19, TypeScript, Vite с **React Compiler**, редактор **TipTap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-text-align`, `@tiptap/html`), раздача статики в продакшене через **Nginx**.
- **Оркестрация:** Docker и Docker Compose (папка `/docker` для Dockerfile-ов).

---

## 2. Критические архитектурные соглашения

### Работа с JSON и Hibernate 7 / Spring Boot 4

- **Тип поля контента:** В DTO (`NewsRequestDto`, `NewsResponseDto`) и в Entity (`NewsEntity`) поле `content` типизировано как **`Map<String, Object>`** с аннотацией `@JdbcTypeCode(SqlTypes.JSON)` и `@Column(columnDefinition = "jsonb")`.
- **Причина:** В Spring Boot 4 используется Jackson 3 (`tools.jackson.*`), а в Hibernate 7 — маппер на базе Jackson 2 (`com.fasterxml.jackson.*`). Использование `Map<String, Object>` полностью исключает конфликты десериализации `JsonNode`.
- **Auditing / Даты:** В сущностях `NewsEntity` и `MediaFileEntity` поле `createdAt` инициализируется через `@PrePersist`, чтобы избежать нарушений `NOT NULL` при вставке.

### Жизненный цикл медиафайлов (S3 / SeaweedFS)

- Все загружаемые изображения (обложки и вставки внутри текста) регистрируются в таблице `t_media_files` со статусами `PENDING` или `ATTACHED`.
- При загрузке картинки внутрь редактора (`POST /api/v1/media/upload`) файл получает статус `PENDING`.
- При сохранении (`POST /api/v1/news`) или обновлении (`PUT /api/v1/news/{id}`) новости сервер рекурсивно обходит дерево `content`, собирает все активные ссылки `src` + `coverUrl` и переводит их в статус `ATTACHED` (привязывая `newsId`). Удаленные из статьи картинки и старые обложки переводятся обратно в `PENDING`.
- При удалении новости (`DELETE /api/v1/news/{id}`) все её файлы переводятся в `PENDING`.
- Фоновая задача `OrphanMediaCleanupJob` (`@Scheduled(cron = "0 0 3 * * *")`) ежедневно в 03:00 удаляет из S3 и БД файлы в статусе `PENDING`, созданные более 24 часов назад.
- **Разделение S3 URL в Docker:** Бэкенд подключается к S3 по внутреннему имени сервиса `S3_ENDPOINT` (`http://s3-news:8333`), но сохраняет в БД и отдает клиенту публичный адрес `S3_PUBLIC_ENDPOINT` (`http://localhost:9000`). Имя сервиса S3 в Docker обязательно использует дефис (`s3-news`), так как символ `_` вызывает `URISyntaxException` в AWS SDK.

### Типографика и разметка контента (WYSIWYG)

- Вместо произвольных CSS-стилей в JSON хранятся семантические варианты абзацев через кастомное расширение `CustomParagraph` (атрибут `variant`: `'default' | 'lead' | 'callout'`).
- Стили классов `.news-p-default`, `.news-p-lead`, `.news-p-callout` и `.news-inline-image` описаны в `NewsEditor.css` и переиспользуются как внутри редактора TipTap, так и при рендеринге статьи для читателя через `generateHTML` из `@tiptap/html`.
- **Правило стилей на фронтенде:** Инлайн-стили (`style={{ ... }}`) запрещены — все стили выносятся в отдельные `.css` файлы.

---

## 3. Безопасность и ролевая модель (JWT)

- Приложение работает в режиме `SessionCreationPolicy.STATELESS` без локальной регистрации и без дефолтного пользователя Spring Security (`UserDetailsServiceAutoConfiguration` исключена в `application.yaml`).
- Внешний сервис авторизации передает JWT-токен (алгоритм `HS256`, ключ `app.variables.jwt.at-secret-key` с обязательным `.trim()`).
- **Ролевая модель:**
  - Наличие валидного JWT-токена обязательно для доступа к приложению и чтения новостей (`GET /api/v1/news/**`). При отсутствии или просрочке токена возвращается `401 Unauthorized`.
  - Роль **`ROLE_NEWSMAKER`** (проверяется в claim `roles` на фронтенде и через `.hasRole("NEWSMAKER")` на бэкенде) открывает доступ к созданию, редактированию, удалению новостей и загрузке файлов (`POST/PUT/DELETE /api/v1/news/**`, `/api/v1/media/**`).
  - Пользователи без `ROLE_NEWSMAKER` видят только ленту новостей и детальные страницы статей.
- На фронтенде токен считывается из query-параметра `?token=...` (с последующей очисткой URL), `localStorage` (`news_keeper_token`) или в dev-режиме из `.env.local` (`VITE_DEV_JWT_TOKEN`). Все запросы выполняются через обертку `authFetch` (`src/utils/api.ts`).
- Для генерации тестовых токенов на бэкенде используется JUnit-тест `JwtGeneratorTest`.

---

## 4. Схема БД и спецификация REST API (`/api/v1`)

### Таблицы PostgreSQL

- **`t_news`**: `id` (BIGSERIAL PK), `title` (VARCHAR), `cover_url` (VARCHAR), `content` (JSONB), `created_at` (TIMESTAMP).
- **`t_media_files`**: `id` (UUID PK), `url` (VARCHAR UNIQUE), `s3_key` (VARCHAR), `status` (VARCHAR: `PENDING`/`ATTACHED`), `news_id` (BIGINT FK -> `t_news(id)` ON DELETE SET NULL), `created_at` (TIMESTAMP).

### Эндпоинты

- `GET /api/v1/news?search={query}&page={0}&size={5}` — постраничный список новостей (`PageResponseDto<NewsResponseDto>`) с регистронезависимым поиском (`ILIKE`) по заголовку и тексту внутри `jsonb`. Поле `content` в элементах списка возвращается как `null` для экономии трафика.
- `GET /api/v1/news/{id}` — полная информация о новости (`NewsResponseDto`), включая дерево `content`.
- `POST /api/v1/media/upload` (`multipart/form-data`, параметр `file`) — загрузка картинки в S3 (доступно только `ROLE_NEWSMAKER`), возвращает `{"url": "..."}`.
- `POST /api/v1/news` (`multipart/form-data`: часть `news` как `application/json` с `NewsRequestDto` + опциональный файл `file` для обложки) — создание новости (`ROLE_NEWSMAKER`).
- `PUT /api/v1/news/{id}?removeCover={boolean}` (`multipart/form-data`: часть `news` + опциональный `file`) — редактирование новости и управление обложкой (`ROLE_NEWSMAKER`).
- `DELETE /api/v1/news/{id}` — удаление новости и перевод её медиафайлов в `PENDING` (`ROLE_NEWSMAKER`).

---

## 5. Структура проекта

```text
NewsKeeper/
├── ai_context.md
├── docker-compose.yml
├── .env
├── docker/
│   ├── news-keeper-back/
│   │   └── Dockerfile
│   └── news-keeper-front/
│       └── Dockerfile
├── news-keeper-back/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/dponyashov/news_keeper_back/
│       │   ├── config/          # AppConfig (record), S3Config, SecurityConfig
│       │   ├── controller/      # NewsController
│       │   ├── dto/             # NewsRequestDto, NewsResponseDto, PageResponseDto
│       │   ├── entity/          # NewsEntity, MediaFileEntity, MediaStatus
│       │   ├── job/             # OrphanMediaCleanupJob
│       │   ├── repository/      # NewsRepository, MediaFileRepository
│       │   ├── security/        # JwtAuthenticationFilter
│       │   └── service/         # NewsService, MediaStorageService, JwtService
│       └── resources/
│           └── application.yaml
└── news-keeper-front/
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── config/apiConfig.ts
        ├── types/news.ts
        ├── utils/
        │   ├── api.ts           # authFetch
        │   └── auth.ts          # initAndGetToken, parseJwt, hasNewsmakerRole
        ├── extensions/
        │   └── CustomParagraph.ts
        ├── hooks/
        │   └── useNewsEditor.ts
        ├── components/
        │   ├── editor/          # NewsEditor, EditorToolbar, CoverUploader, NewsEditor.css
        │   └── viewer/          # NewsViewer, NewsList, NewsCard, NewsDetailView, Pagination, NewsViewer.css
        ├── App.tsx
        └── App.css
```

---

## 6. Команды запуска и конфигурации

- **Запуск всего стека в Docker:** `docker compose up -d --build`
- **Сервисы в `docker-compose.yml`:**
  - `db-news` (PostgreSQL 17, порт `${DB_NEWS_PORT}`)
  - `s3-news` (SeaweedFS, порт `${S3_PORT}`, зависимость через `service_started`)
  - `news-backend` (Spring Boot, внутренний порт `${NEWS_BACK_PORT}`, подключается к `db-news:5432` и `http://s3-news:8333`)
  - `news-frontend` (Nginx SPA, порт `${NEWS_FRONT_PORT}:80`, переменная сборки `VITE_API_URL=${NEWS_API_URL}`)
- **Установка npm-пакетов во фронтенде:** выполняется с флагом `--legacy-peer-deps` из-за совместимости `@vitejs/plugin-react` (React Compiler) и пакетов TipTap.
