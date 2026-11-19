# NewsKeeper

Корпоративный новостной портал с блочным WYSIWYG-редактором статей, S3-хранилищем медиафайлов, полнотекстовым поиском и Stateless JWT-авторизацией.

## Основные возможности

- **Блочный редактор новостей (TipTap):** создание и редактирование статей с обложками, загрузкой изображений (кнопкой, перетаскиванием или из буфера обмена), таблицами, списками, цитатами, ссылками и семантическими стилями абзацев (обычный текст, крупный лид, акцентная врезка).
- **Умное управление медиафайлами:** автоматическая привязка изображений к статьям и фоновая очистка «осиротевших» файлов из S3-хранилища через `@Scheduled`-задачу.
- **Лента новостей и поиск:** постраничный вывод новостей (`Pagination`), просмотр полных статей с сохранением WYSIWYG-разметки и регистронезависимый поиск по заголовкам и тексту статей (`jsonb`).
- **Ролевая модель доступа (JWT):** интеграция с внешним сервисом аутентификации. Пользователи с ролью `ROLE_NEWSMAKER` получают доступ к созданию, изменению и удалению публикаций; остальные авторизованные пользователи — к чтению ленты.
- **Единый шлюз Nginx:** в продакшен-сборке Nginx раздает SPA-фронтенд и проксирует запросы к `/api/` и `/news-media/` без необходимости открывать порты бэкенда и S3 наружу.

---

## Технологический стек

- **Backend:** Java 21, Spring Boot 4.1, Spring Security (JWT / JJWT), Spring Data JPA (Hibernate 7), Flyway, AWS SDK S3 v2.
- **Frontend:** React 19, TypeScript, Vite (React Compiler), TipTap, Nginx.
- **Инфраструктура:** PostgreSQL 17, SeaweedFS (S3-совместимое хранилище), Docker Compose.

---

## Быстрый старт (Docker Compose)

### 1. Подготовка переменных окружения

Создайте файл `.env` в корневой директории проекта (рядом с `docker-compose.yml`):

```env
# === База данных PostgreSQL ===
DB_NEWS_PORT=5432
DB_NEWS_NAME=news_database
DB_NEWS_USER=postgres
DB_NEWS_PASSWORD=postgres

# === S3 хранилище (SeaweedFS) ===
S3_PORT=9000
S3_ENDPOINT=http://s3-news:8333
# Оставьте пустым для работы через прокси Nginx (/news-media/...)
S3_PUBLIC_ENDPOINT=
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=news-media
S3_REGION=us-east-1

# === Бэкенд (Spring Boot) ===
NEWS_BACK_PORT=8080
NODE_ENV=production
FRONT_URL=http://localhost:3000
JWT_ACCESS_SECRET=ваш_base64_секретный_ключ_длиной_44_символа
JWT_REFRESH_SECRET=ваш_base64_refresh_секретный_ключ_44_символа
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

# === Фронтенд (React + Nginx) ===
NEWS_FRONT_PORT=3000
NEWS_API_URL=/api/v1
```

### 2. Сборка и запуск контейнеров

Выполните из корня репозитория:

```bash
docker compose up -d --build
```

После запуска приложение будет доступно по адресу: **`http://localhost:3000`**

---

## Авторизация и тестирование ролей

Приложение ожидает валидный JWT-токен (подписанный алгоритмом `HS256` с ключом `JWT_ACCESS_SECRET`), содержащий claim `roles`:

```json
{
  "sub": "user@example.com",
  "roles": ["ROLE_USER", "ROLE_NEWSMAKER"],
  "exp": 1795000000
}
```

### Способы передачи токена во фронтенд:

1. **Через URL при переходе из внешнего портала:** `http://localhost:3000/?token=<ваш_jwt_токен>` (токен автоматически сохраняется в `localStorage` и удаляется из адресной строки).
2. **Для локальной разработки фронтенда:** создайте файл `news-keeper-front/.env.local` и укажите:
   ```env
   VITE_DEV_JWT_TOKEN=<ваш_тестовый_токен>
   VITE_API_URL=http://localhost:8085/api/v1
   ```
3. **Генерация тестовых токенов:** на бэкенде доступен JUnit-тест `JwtGeneratorTest`, который генерирует два долгоживущих токена (с ролью `ROLE_NEWSMAKER` и без неё) на основе ключа из конфигурации.

---

## Локальная разработка (без Docker для кода)

1. Запустите инфраструктуру (PostgreSQL и SeaweedFS):
   ```bash
   docker compose up -d db-news s3-news
   ```
2. Запустите бэкенд из папки `news-keeper-back` (убедитесь, что `S3_ENDPOINT=http://localhost:9000` и `S3_PUBLIC_ENDPOINT=http://localhost:9000`):
   ```bash
   ./mvnw spring-boot:run
   ```
3. Установите зависимости и запустите фронтенд из папки `news-keeper-front`:
   ```bash
   npm install --legacy-peer-deps
   npm run dev
   ```
