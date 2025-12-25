# ⚡ Quick Start - CinemaHub Movie Aggregator

## 🎯 Цель
Запустить полностью работающий CinemaHub Movie Aggregator за 5 минут

---

## ✅ Требования

- ✅ **MySQL 8.0** установлен и запущен (порт 3306)
- ✅ **Node.js 16+** и npm
- ✅ **Java 17+**
- ✅ **Maven 3.8+**

---

## 🚀 Запуск за 5 шагов

### 1️⃣ Установите MySQL (если ещё не установлен)

**Скачайте:** https://dev.mysql.com/downloads/installer/  
**Выберите:** mysql-installer-community-8.x.x.msi  
**Root password:** `root`

**Проверьте:**
```powershell
Get-Service MySQL80
# Должен быть Running
```

### 2️⃣ Создайте базу данных warehouse

```powershell
# Вариант A: Автоматически (Spring Boot сделает сам)
# Просто создайте пустую БД:
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS warehouse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Вариант B: Вручную (с тестовыми данными)
cd "C:\Users\user\Desktop\Course work (agregator)\movie-aggregator-backend\src\main\resources"
mysql -u root -p warehouse < schema.sql
mysql -u root -p warehouse < data.sql
```

### 3️⃣ Запустите Backend

```powershell
cd "C:\Users\user\Desktop\Course work (agregator)"

# Способ 1: Через bat-файл
start-backend.bat

# Способ 2: Через Maven
cd movie-aggregator-backend
./mvnw spring-boot:run
```

**Ожидайте:** `Started MovieAggregatorApplication in X.XXX seconds`  
**Откроется:** http://localhost:8080

### 4️⃣ Запустите Frontend

```powershell
# В новом окне PowerShell
cd "C:\Users\user\Desktop\Course work (agregator)"

# Способ 1: Через bat-файл
start-frontend.bat

# Способ 2: Через npm
cd movie-aggregator-frontend
npm install   # Только первый раз
npm run dev
```

**Откроется:** http://localhost:3001

### 5️⃣ Войдите в систему

**Откройте:** http://localhost:3001

**Нажмите:** "Вход" в правом верхнем углу

**Введите:**
```
Username: demo
Password: demo123
```

**Готово!** 🎉 Вы в системе!

---

## 🧪 Что попробовать

### ✅ Регистрация нового пользователя
1. Нажмите "Регистрация"
2. Заполните форму (следите за индикаторами валидации)
3. Автоматический вход после регистрации

### ✅ Защищённые страницы
1. Нажмите на свой username в навигации
2. Откроется страница профиля (защищённая)
3. Выйдите и попробуйте открыть /profile напрямую → редирект на /login

### ✅ Swagger UI (API документация)
Откройте: http://localhost:8080/swagger-ui.html

### ✅ MySQL Workbench
1. Откройте MySQL Workbench
2. Подключитесь к localhost:3306
3. Выберите базу `warehouse`
4. Посмотрите таблицы, данные, триггеры

---

## 📊 Тестовые данные

### Пользователи (4)
| Username | Password | Роль | Описание |
|----------|----------|------|----------|
| demo | demo123 | USER | Обычный пользователь |
| admin | demo123 | ADMIN | Администратор |
| critic_john | demo123 | CRITIC | Проф. критик |
| movie_fan | demo123 | USER | Любитель кино |

### Контент (20)
- **8 фильмов:** Дюна 3, Интерстеллар 2, MI8, Аватар 4, Дэдпул и Росомаха 2, Бэтмен, Гладиатор 3, Фантастические твари 4
- **5 сериалов:** The Last of Us S2, House of the Dragon S3, TWD: Survivors, Rings of Power S3, The Witcher S4
- **7 игр:** GTA 6, TES 6, AC Shadows, Fable 4, Perfect Dark, Silksong, Jedi Survivor 2

### Оценки
22 оценки от пользователей с эмоциями (EXCITED, HAPPY, INSPIRED, etc.)

---

## 🔧 Решение проблем

### ❌ MySQL не запущен
```powershell
Start-Service MySQL80
```

### ❌ Порт 8080 занят
```powershell
# Найдите процесс
netstat -ano | findstr :8080

# Убейте процесс (замените PID)
taskkill /PID <PID> /F
```

### ❌ Порт 3306 занят
Измените порт в application.properties:
```properties
spring.datasource.url=jdbc:mysql://localhost:НОВЫЙ_ПОРТ/warehouse...
```

### ❌ Access denied for user 'root'
Проверьте пароль в application.properties:
```properties
spring.datasource.username=root
spring.datasource.password=root  # Ваш пароль MySQL
```

### ❌ Table 'warehouse.users' doesn't exist
Выполните schema.sql вручную:
```powershell
cd movie-aggregator-backend/src/main/resources
mysql -u root -p warehouse < schema.sql
```

### ❌ Frontend не запускается
```powershell
cd movie-aggregator-frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📚 Дополнительная документация

Если нужны подробности:
- **[MYSQL-SETUP.md](MYSQL-SETUP.md)** - Детальная установка MySQL
- **[DATABASE-INFO.md](DATABASE-INFO.md)** - Структура БД
- **[AUTH-SYSTEM.md](AUTH-SYSTEM.md)** - Система авторизации
- **[TESTING-AUTH.md](TESTING-AUTH.md)** - Тестирование

---

## 🎓 Готово к защите!

После выполнения Quick Start у вас будет:
- ✅ Работающий Backend на порту 8080
- ✅ Работающий Frontend на порту 3001
- ✅ База данных MySQL с 150+ записями
- ✅ 4 тестовых пользователя
- ✅ 20 контентов (фильмы/сериалы/игры)
- ✅ Система JWT авторизации
- ✅ Защищённые маршруты
- ✅ Swagger UI для API

**Время выполнения:** ~5 минут ⚡

**Успехов! 🚀**
