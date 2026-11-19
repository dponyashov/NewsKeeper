# AI Context: NewsKeeper (Fullstack News Platform)

Этот документ содержит актуальный архитектурный контекст, технические соглашения и структуру проекта **NewsKeeper** для быстрого погружения ИИ-ассистента в новых сессиях.

---

## 1. Технологический стек и инфраструктура

- **База данных и миграции:** PostgreSQL 17 (`postgres:17-alpine`), версионность схемы через **Flyway** (`spring-boot-starter-flyway` + `flyway-database-postgresql`), валидация схемы Hibernate (`ddl-auto: validate`).
- **Объектное хранилище (S3):** SeaweedFS (`chrislusf/seaweedfs:latest`), S3 API на внутреннем порту `8333`.
- **Бэкенд:** Java 21+, Spring Boot 4.1 (Spring Web, Spring Data JPA / Hibernate 7, Spring Security, Validation, Lombok, AWS SDK for Java v2 `2.29.0`, JJWT `0.12.6`).
- **Фронтенд:** React 19, TypeScript, Vite с **React Compiler**, WYSIWYG-редактор **TipTap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-text-align`, `@tiptap/extension-link`, `@tiptap/extension-table`, `@tiptap/html`).
- **Единый шлюз и оркестрация:** Nginx (раздача SPA + reverse-proxy для `/api/` и `/news-media/`), Docker и Docker Compose (Dockerfile-ы вынесены в папку `/docker`).

---

## 2. Критические архитектурные соглашения

### Работа с JSON и Hibernate 7 / Spring Boot 4

- **Тип поля контента:** В DTO (`NewsRequestDto`, `NewsResponseDto`) и в Entity (`NewsEntity`) поле `content` типизировано как **`Map<String, Object>`** с аннотацией `@JdbcTypeCode(SqlTypes.JSON)` и `@Column(columnDefinition = "jsonb")`.
- **Причина:** В Spring Boot 4 используется Jackson 3 (`tools.jackson.*`), а в Hibernate 7 — маппер на базе Jackson 2 (`com.fasterxml.jackson.*`). Использование `Map<String, Object>` исключает конфликты десериализации `JsonNode`.
- **Даты создания:** В сущностях `NewsEntity` и `MediaFileEntity` поле `createdAt` инициализируется через `@PrePersist`.

### Миграции базы данных (Flyway)

- Миграции лежат в `news-keeper-back/src/main/resources/db/migration/` (`V1__init_schema.sql` и далее).
- В `application.yaml` включено `baseline-on-migrate: true` (для совместимости с существующей БД) и `spring.jpa.hibernate.ddl-auto: validate`.
- Для ускорения поиска `ILIKE` используется расширение PostgreSQL `pg_trgm` и GIN-индекс на колонку `title`.

### Жизненный цикл медиафайлов (S3 / SeaweedFS)

- Все загружаемые изображения регистрируются в таблице `t_media_files` со статусами `PENDING` или `ATTACHED`.
- При загрузке картинки внутрь редактора (`POST /api/v1/media/upload`) файл получает статус `PENDING`.
- При сохранении (`POST /api/v1/news`) или обновлении (`PUT /api/v1/news/{id}`) новости сервер рекурсивно обходит дерево `content`, собирает активные ссылки `src` + `coverUrl` и переводит их в статус `ATTACHED` (привязывая `newsId`). Удаленные из статьи картинки и старые обложки переводятся обратно в `PENDING`.
- При удалении новости (`DELETE /api/v1/news/{id}`) все её файлы переводятся в `PENDING`.
- Фоновая задача `OrphanMediaCleanupJob` (`@Scheduled(cron = "0 0 3 * * *")`) ежедневно в 03:00 удаляет из S3 и БД файлы в статусе `PENDING` старше 24 часов.
- **Сетевое взаимодействие S3:** Бэкенд подключается к S3 по внутреннему Docker-имени `http://s3-news:8333` (имя сервиса обязательно с дефисом, т.к. символ `_` вызывает `URISyntaxException` в AWS SDK). При пустом `S3_PUBLIC_ENDPOINT` в БД сохраняются относительные пути `/news-media/uuid.jpg`, которые проксируются через Nginx.

### Типографика, расширения TipTap и стили фронтенда

- Общий набор расширений TipTap вынесен в `src/extensions/tiptapExtensions.ts` (`CustomParagraph` с вариантами `'default' | 'lead' | 'callout'`, `Image`, `TextAlign`, `Link`, `Table`, списки, цитаты) и переиспользуется как в редакторе (`useNewsEditor`), так и при рендеринге статьи через `generateHTML` (`NewsDetailView`).
- **Правило стилей:** Инлайн-стили (`style={{ ... }}`) запрещены — все стили вынесены в отдельные `.css` файлы.

---

## 3. Безопасность и ролевая модель (JWT)

- Приложение работает в режиме `SessionCreationPolicy.STATELESS` без локальной аутентификации (`UserDetailsServiceAutoConfiguration` исключена в `application.yaml`).
- Внешний сервис авторизации передает JWT-токен (`HS256`, ключ `app.variables.jwt.at-secret-key` с обязательным `.trim()`).
- **Роли:**
  - Наличие валидного JWT обязательно для входа и чтения новостей (`GET /api/v1/news/**`). При отсутствии или просрочке токена возвращается `401 Unauthorized`.
  - Роль **`ROLE_NEWSMAKER`** (проверяется в claim `roles` на фронтенде и через `.hasRole("NEWSMAKER")` на бэкенде) открывает доступ к созданию, редактированию, удалению новостей и загрузке файлов (`POST/PUT/DELETE /api/v1/news/**`, `/api/v1/media/**`).
- На фронтенде токен считывается из URL (`?token=...` с очисткой адресной строки), `localStorage` (`news_keeper_token`) или в dev-режиме из `.env.local` (`VITE_DEV_JWT_TOKEN`). Все запросы идут через обертку `authFetch` (`src/utils/api.ts`).

---

## 4. Спецификация REST API (`/api/v1`)

- `GET /api/v1/news?search={query}&page={0}&size={5}` — постраничный список новостей (`PageResponseDto<NewsResponseDto>`) с регистронезависимым поиском (`ILIKE`) по заголовку и тексту внутри `jsonb`. Поле `content` в списке возвращается как `null`.
- `GET /api/v1/news/{id}` — полная информация о новости (`NewsResponseDto`), включая `content`.
- `POST /api/v1/media/upload` (`multipart/form-data`, параметр `file`) — загрузка картинки в S3 (`ROLE_NEWSMAKER`), возвращает `{"url": "/news-media/..."}`.
- `POST /api/v1/news` (`multipart/form-data`: `news` как `application/json` с `NewsRequestDto` + опциональный `file` для обложки) — создание новости (`ROLE_NEWSMAKER`).
- `PUT /api/v1/news/{id}?removeCover={boolean}` (`multipart/form-data`: `news` + опциональный `file`) — редактирование новости и управление обложкой (`ROLE_NEWSMAKER`).
- `DELETE /api/v1/news/{id}` — удаление новости и перевод её медиафайлов в `PENDING` (`ROLE_NEWSMAKER`).

---

## 5. Структура проекта

```text
NewsKeeper/
├── ai_context.md
├── README.md
├── docker-compose.yml
├── .env
├── docker/
│   ├── news-keeper-back/
│   │   └── Dockerfile
│   └── news-keeper-front/
│       └── Dockerfile
├── news-keeper-back/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/dponyashov/news_keeper_back/
│       │   │   ├── config/          # AppConfig (record), S3Config, SecurityConfig
│       │   │   ├── controller/      # NewsController
│       │   │   ├── dto/             # NewsRequestDto, NewsResponseDto, PageResponseDto
│       │   │   ├── entity/          # NewsEntity, MediaFileEntity, MediaStatus
│       │   │   ├── job/             # OrphanMediaCleanupJob
│       │   │   ├── repository/      # NewsRepository, MediaFileRepository
│       │   │   ├── security/        # JwtAuthenticationFilter
│       │   │   └── service/         # NewsService, MediaStorageService, JwtService
│       │   └── resources/
│       │       ├── application.yaml
│       │       └── db/migration/    # Flyway SQL-миграции (V1__init_schema.sql)
│       └── test/                    # JwtGeneratorTest
└── news-keeper-front/
    ├── nginx.conf                   # Единый reverse-proxy для SPA, /api/ и /news-media/
    ├── package.json
    └── src/
        ├── config/apiConfig.ts
        ├── types/news.ts
        ├── utils/
        │   ├── api.ts               # authFetch
        │   └── auth.ts              # initAndGetToken, parseJwt, hasNewsmakerRole
        ├── extensions/
        │   ├── CustomParagraph.ts
        │   └── tiptapExtensions.ts
        ├── hooks/
        │   └── useNewsEditor.ts
        ├── components/
        │   ├── editor/              # NewsEditor, EditorToolbar, CoverUploader, NewsEditor.css
        │   └── viewer/              # NewsViewer, NewsList, NewsCard, NewsDetailView, Pagination, NewsViewer.css
        ├── App.tsx
        └── App.css
```

## 6. Команды запуска и конфигурации

- **Запуск всего стека в Docker:** `docker compose up -d --build`
- **Сервисы в `docker-compose.yml`:**
  - `db-news` (PostgreSQL 17, порт `${DB_NEWS_PORT}`)
  - `s3-news` (SeaweedFS, порт `${S3_PORT}`, зависимость через `service_started`)
  - `news-backend` (Spring Boot, внутренний порт `${NEWS_BACK_PORT}`, подключается к `db-news:5432` и `http://s3-news:8333`)
  - `news-frontend` (Nginx SPA, порт `${NEWS_FRONT_PORT}:80`, переменная сборки `VITE_API_URL=${NEWS_API_URL}`)
- **Установка npm-пакетов во фронтенде:** выполняется с флагом `--legacy-peer-deps` из-за совместимости `@vitejs/plugin-react` (React Compiler) и пакетов TipTap.
