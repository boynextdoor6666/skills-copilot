# 🗄️ Настройка MySQL для CinemaHub (база данных warehouse)

## 📦 Установка MySQL на Windows

### Вариант 1: MySQL Installer (Рекомендуется)

1. **Скачайте MySQL Installer:**
   - Перейдите на https://dev.mysql.com/downloads/installer/
   - Выберите **mysql-installer-community-8.x.x.msi** (Web или Full)
   - Скачайте файл (можно без регистрации через "No thanks, just start my download")

2. **Запустите установщик:**
   ```
   mysql-installer-community-8.x.x.msi
   ```

3. **Выберите тип установки:**
   - **Developer Default** (для разработки) - содержит MySQL Server, Workbench, Shell, etc.
   - Или **Custom** - выберите MySQL Server 8.x и MySQL Workbench

4. **Настройка MySQL Server:**
   - **Port:** `3306` (по умолчанию)
   - **Config Type:** Development Computer
   - **Authentication Method:** Use Strong Password Encryption
   - **Root Password:** `root` (или любой другой, не забудьте обновить `application.properties`)
   - **Windows Service:** MySQL80 (запуск при старте системы)

5. **Завершение установки:**
   - Нажмите "Execute" для применения конфигурации
   - После завершения нажмите "Finish"

### Вариант 2: Портативная версия (без установщика)

1. Скачайте ZIP архив с https://dev.mysql.com/downloads/mysql/
2. Распакуйте в `C:\mysql`
3. Создайте `my.ini` файл конфигурации (см. раздел "Ручная конфигурация")
4. Инициализируйте базу данных:
   ```powershell
   cd C:\mysql\bin
   .\mysqld --initialize-insecure
   ```
5. Запустите сервер:
   ```powershell
   .\mysqld --console
   ```

---

## ⚙️ Проверка установки

### Проверка службы MySQL

1. Откройте **Services** (Win + R → `services.msc`)
2. Найдите **MySQL80**
3. Убедитесь что статус: **Running**
4. Если не запущена, нажмите **Start**

### Проверка через командную строку

```powershell
# Проверка версии MySQL
mysql --version

# Подключение к MySQL
mysql -u root -p
# Введите пароль: root

# В MySQL консоли:
SELECT VERSION();
SHOW DATABASES;
EXIT;
```

---

## 🏗️ Создание базы данных warehouse

### Способ 1: Через MySQL Workbench (Графический интерфейс)

1. **Откройте MySQL Workbench**
2. **Подключитесь к серверу:**
   - Hostname: `localhost`
   - Port: `3306`
   - Username: `root`
   - Password: `root`
3. **Создайте базу данных:**
   - Нажмите "Create a new schema" (иконка цилиндра с +)
   - Name: `warehouse`
   - Charset: `utf8mb4`
   - Collation: `utf8mb4_unicode_ci`
   - Apply

4. **Импортируйте schema.sql:**
   - File → Open SQL Script
   - Выберите `movie-aggregator-backend/src/main/resources/schema.sql`
   - Execute (⚡ иконка)

5. **Импортируйте data.sql:**
   - File → Open SQL Script
   - Выберите `movie-aggregator-backend/src/main/resources/data.sql`
   - Execute (⚡ иконка)

6. **Проверьте созданные таблицы:**
   ```sql
   USE warehouse;
   SHOW TABLES;
   SELECT * FROM users;
   SELECT * FROM movies LIMIT 5;
   ```

### Способ 2: Через командную строку

```powershell
# Подключитесь к MySQL
mysql -u root -p
# Введите пароль: root
```

```sql
-- Создайте базу данных
CREATE DATABASE warehouse
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Выйдите из MySQL
EXIT;
```

```powershell
# Импортируйте schema.sql
cd "C:\Users\user\Desktop\Course work (agregator)\movie-aggregator-backend\src\main\resources"
mysql -u root -p warehouse < schema.sql

# Импортируйте data.sql
mysql -u root -p warehouse < data.sql
```

### Способ 3: Автоматический (Spring Boot выполнит скрипты)

Spring Boot автоматически выполнит `schema.sql` и `data.sql` при старте, если:
- Файлы находятся в `src/main/resources/`
- В `application.properties` указано: `spring.jpa.hibernate.ddl-auto=update`

**Примечание:** Для автоматического выполнения добавьте в `application.properties`:
```properties
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema.sql
spring.sql.init.data-locations=classpath:data.sql
```

---

## 🚀 Запуск приложения

### 1. Убедитесь что MySQL запущен

```powershell
# PowerShell
Get-Service MySQL80

# Если не запущен:
Start-Service MySQL80
```

### 2. Обновите зависимости Maven

```powershell
cd "C:\Users\user\Desktop\Course work (agregator)\movie-aggregator-backend"
./mvnw clean install
```

### 3. Запустите Spring Boot приложение

```powershell
./mvnw spring-boot:run
```

**Ожидаемый вывод:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.0)

2025-10-01T15:30:00.123  INFO --- [main] c.m.MovieAggregatorApplication : Starting MovieAggregatorApplication
2025-10-01T15:30:01.456  INFO --- [main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http)
2025-10-01T15:30:01.567  INFO --- [main] c.m.MovieAggregatorApplication : Started MovieAggregatorApplication in 2.345 seconds
```

### 4. Проверьте подключение

Откройте браузер:
- **API:** http://localhost:8080
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **Health Check:** http://localhost:8080/actuator/health

---

## 🧪 Тестирование базы данных

### Проверка данных в MySQL Workbench

```sql
USE warehouse;

-- Количество записей
SELECT 'Пользователей' AS Таблица, COUNT(*) AS Записей FROM users
UNION ALL
SELECT 'Фильмов', COUNT(*) FROM movies WHERE content_type = 'MOVIE'
UNION ALL
SELECT 'Сериалов', COUNT(*) FROM movies WHERE content_type = 'SERIES'
UNION ALL
SELECT 'Игр', COUNT(*) FROM movies WHERE content_type = 'GAME'
UNION ALL
SELECT 'Оценок', COUNT(*) FROM user_ratings
UNION ALL
SELECT 'Рецензий', COUNT(*) FROM reviews;

-- Топ фильмов по Metascore
SELECT title, metascore, user_score, total_ratings
FROM movies
WHERE content_type = 'MOVIE'
ORDER BY metascore DESC
LIMIT 10;

-- Пользователи с данными для входа
SELECT username, email, 'demo123' AS password
FROM users;

-- Рецензии критиков
SELECT 
    m.title,
    r.reviewer_name,
    r.rating,
    LEFT(r.content, 100) AS preview
FROM reviews r
JOIN movies m ON r.movie_id = m.id
WHERE r.review_type = 'CRITIC'
ORDER BY r.publication_date DESC;
```

### Тестовые пользователи

| Username     | Email                  | Password | Роль   | Описание              |
|--------------|------------------------|----------|--------|-----------------------|
| `demo`       | demo@cinemahub.com     | demo123  | USER   | Обычный пользователь  |
| `admin`      | admin@cinemahub.com    | demo123  | ADMIN  | Администратор         |
| `critic_john`| john@metacritic.com    | demo123  | CRITIC | Профессиональный критик |
| `movie_fan`  | fan@example.com        | demo123  | USER   | Любитель кино         |

---

## 🔧 Решение проблем

### Проблема: MySQL не запускается

**Решение 1:** Проверьте занят ли порт 3306
```powershell
netstat -ano | findstr :3306
```

Если порт занят другим процессом:
- Измените порт в `my.ini` (в папке MySQL)
- Обновите `application.properties`: `spring.datasource.url=jdbc:mysql://localhost:НОВЫЙ_ПОРТ/warehouse...`

**Решение 2:** Переустановите службу
```powershell
# Остановите службу
Stop-Service MySQL80

# Удалите службу
sc delete MySQL80

# Переустановите через MySQL Installer
```

### Проблема: Access denied for user 'root'@'localhost'

**Решение:** Сбросьте пароль root
```powershell
# Остановите MySQL
Stop-Service MySQL80

# Запустите без проверки паролей
mysqld --skip-grant-tables

# В новом окне PowerShell:
mysql -u root

# В MySQL:
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
EXIT;

# Перезапустите MySQL нормально
Start-Service MySQL80
```

### Проблема: Spring Boot не может подключиться к MySQL

**Проверьте:**
1. MySQL запущен: `Get-Service MySQL80`
2. База данных существует: 
   ```sql
   SHOW DATABASES;
   ```
3. Правильные credentials в `application.properties`:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=root
   ```
4. Драйвер MySQL в `pom.xml`:
   ```xml
   <dependency>
       <groupId>com.mysql</groupId>
       <artifactId>mysql-connector-j</artifactId>
   </dependency>
   ```

### Проблема: Таблицы не создаются

**Решение:** Проверьте логи Spring Boot на ошибки:
```
2025-10-01 ... ERROR ... Table 'warehouse.users' doesn't exist
```

Вручную выполните `schema.sql`:
```powershell
mysql -u root -p warehouse < src/main/resources/schema.sql
```

### Проблема: Кириллица отображается как ????

**Решение:** Убедитесь что база использует UTF-8:
```sql
ALTER DATABASE warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

В `application.properties` добавьте:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/warehouse?useUnicode=yes&characterEncoding=UTF-8
```

---

## 📊 Структура базы данных warehouse

### Основные таблицы

| Таблица           | Описание                          | Записей (тестовые) |
|-------------------|-----------------------------------|---------------------|
| `users`           | Пользователи системы              | 4                   |
| `movies`          | Фильмы, сериалы, игры             | 20                  |
| `movie_genres`    | Жанры контента                    | 60                  |
| `user_ratings`    | Оценки пользователей              | 22                  |
| `reviews`         | Рецензии критиков и пользователей | 7                   |
| `achievements`    | Достижения системы                | 10                  |
| `user_achievements`| Достижения пользователей         | 10                  |
| `user_follows`    | Подписки пользователей            | 4                   |
| `watchlist`       | Списки "Хочу посмотреть"          | 6                   |
| `rating_history`  | История изменения рейтингов       | 6                   |
| `review_votes`    | Голоса за рецензии                | 6                   |

### Представления (Views)

- `top_movies_by_metascore` - Топ фильмов по Metascore
- `user_statistics` - Статистика пользователей

### Триггеры

- `after_rating_insert` - Обновляет счётчики при добавлении оценки
- `after_rating_delete` - Обновляет счётчики при удалении оценки
- `after_review_insert` - Обновляет счётчики при добавлении рецензии
- `after_review_delete` - Обновляет счётчики при удалении рецензии

---

## 🎯 Быстрый старт (всё в одном)

```powershell
# 1. Проверьте MySQL
Get-Service MySQL80

# 2. Создайте базу данных (если ещё не создана)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Импортируйте схему и данные
cd "C:\Users\user\Desktop\Course work (agregator)\movie-aggregator-backend\src\main\resources"
mysql -u root -p warehouse < schema.sql
mysql -u root -p warehouse < data.sql

# 4. Соберите проект
cd "C:\Users\user\Desktop\Course work (agregator)\movie-aggregator-backend"
./mvnw clean install

# 5. Запустите приложение
./mvnw spring-boot:run

# 6. Откройте в браузере
start http://localhost:8080/swagger-ui.html
```

---

## ✅ Готово!

База данных **warehouse** создана и готова к использованию с CinemaHub! 🎉

**Следующие шаги:**
1. Запустите frontend: `cd movie-aggregator-frontend && npm run dev`
2. Откройте http://localhost:3001
3. Войдите с тестовым пользователем: `demo` / `demo123`
4. Протестируйте систему авторизации
5. Начните работу с API через Swagger UI

**Полезные ссылки:**
- Backend API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- Frontend: http://localhost:3001
- MySQL Workbench: Подключение к localhost:3306
