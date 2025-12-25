# 🔐 Система регистрации и авторизации CinemaHub

## ✅ Реализовано

### Backend (Spring Boot)

#### 1. **Security Configuration**

**JwtUtil.java** - Утилита для работы с JWT токенами
```java
Функции:
- generateToken() - создание JWT токена
- validateToken() - проверка валидности токена
- extractUsername() - извлечение username из токена
- extractExpiration() - проверка срока действия

Настройки:
- Secret Key: CinemaHubSecretKey2025...
- Expiration: 24 часа (86400000 ms)
- Algorithm: HS256
```

**JwtRequestFilter.java** - Фильтр для проверки токена при каждом запросе
```java
Работа фильтра:
1. Извлекает токен из заголовка Authorization
2. Проверяет формат: "Bearer <token>"
3. Валидирует токен
4. Устанавливает аутентификацию в SecurityContext
5. Пропускает запрос дальше
```

**SecurityConfig.java** - Конфигурация Spring Security
```java
Настройки:
- CORS разрешён для localhost:3000, 3001, 5173
- Публичные эндпоинты: /api/auth/**, /api/public/**
- Публичные данные: /api/movies/**, /api/series/**, /api/games/**
- Защищённые: /api/profile/**, /api/reviews/** (требуют токен)
- Session Management: STATELESS (без сессий)
- Password Encoder: BCrypt
```

**UserDetailsServiceImpl.java** - Сервис для загрузки пользователей
```java
Функции:
- loadUserByUsername() - загрузка пользователя из БД
- getAuthorities() - получение ролей пользователя
- Интеграция с Spring Security
```

#### 2. **REST Controllers**

**AuthController.java** - API для аутентификации

**Эндпоинты:**

**POST /api/auth/register**
```json
Request:
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}

Response (201 Created):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "username": "user123",
  "email": "user@example.com",
  "role": "USER",
  "message": "Регистрация успешна"
}

Errors:
- 400: "Имя пользователя уже занято"
- 400: "Email уже зарегистрирован"
```

**POST /api/auth/login**
```json
Request:
{
  "username": "user123",
  "password": "password123"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "username": "user123",
  "email": "user@example.com",
  "role": "USER",
  "message": "Успешный вход"
}

Errors:
- 401: "Неверное имя пользователя или пароль"
```

**GET /api/auth/validate**
```json
Request Headers:
Authorization: Bearer <token>

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "username": "user123",
  "email": "user@example.com",
  "role": "USER",
  "message": "Токен валиден"
}

Errors:
- 401: "Недействительный токен"
```

#### 3. **Data Models**

**User.java** (уже существовала, используется)
```java
Поля:
- id: Long (Primary Key)
- username: String (Unique, NOT NULL)
- email: String (Unique, NOT NULL)
- password: String (Encrypted with BCrypt)
- role: UserRole (USER, MODERATOR, ADMIN)
- level: UserLevel (NOVICE, REGULAR, EXPERT, CRITIC)
- registrationDate: LocalDateTime
- totalReviews: Integer
- totalRatings: Integer
- reputation: Integer
```

**UserRepository.java**
```java
Методы:
- findByUsername(String username): Optional<User>
- findByEmail(String email): Optional<User>
- existsByUsername(String username): Boolean
- existsByEmail(String email): Boolean
```

#### 4. **DTOs**

**AuthRequest.java**
```java
{
  username: String
  password: String
}
```

**RegisterRequest.java**
```java
{
  username: String
  email: String
  password: String
}
```

**AuthResponse.java**
```java
{
  token: String
  userId: Long
  username: String
  email: String
  role: String
  message: String
}
```

---

### Frontend (React)

#### 1. **Context API**

**AuthContext.jsx** - Глобальное состояние авторизации
```javascript
Состояние:
- user: { userId, username, email, role }
- token: String (сохраняется в localStorage)
- loading: Boolean
- isAuthenticated: Boolean

Функции:
- login(username, password) - вход
- register(username, email, password) - регистрация
- logout() - выход
- validateToken() - проверка токена при загрузке

Axios Interceptor:
- Автоматически добавляет токен ко всем запросам
- Заголовок: Authorization: Bearer <token>
```

#### 2. **Pages**

**Login.jsx** - Страница входа
```javascript
Компоненты:
- Форма с username и password
- Кнопка показать/скрыть пароль (Eye/EyeOff иконки)
- Обработка ошибок
- Ссылка на регистрацию
- Ссылка "Забыли пароль?"
- Демо-аккаунт (username: demo, password: demo123)

Валидация:
- Обязательные поля
- Минимальная длина

Дизайн:
- Тёмная тема
- Жёлтые акценты (#f5c518)
- Иконки User, Lock
- Анимированный логотип с Sparkles
```

**Register.jsx** - Страница регистрации
```javascript
Компоненты:
- Форма с username, email, password, confirmPassword
- Кнопки показать/скрыть пароли
- Валидация пароля в реальном времени
- Индикаторы требований к паролю
- Обработка ошибок
- Ссылка на вход
- Ссылки на Terms и Privacy

Валидация пароля:
✓ Минимум 6 символов
✓ Содержит цифру
✓ Содержит букву
✓ Пароли совпадают

Визуальная валидация:
- Зелёная галочка (Check) - выполнено
- Серый крестик (X) - не выполнено
- Динамическое обновление

Дизайн:
- Тёмная тема
- Иконки User, Mail, Lock
- Анимация при вводе
- Disabled кнопка если валидация не пройдена
```

#### 3. **Components**

**ProtectedRoute.jsx** - Защищённый маршрут
```javascript
Функции:
- Проверяет isAuthenticated
- Показывает загрузку во время проверки токена
- Редиректит на /login если не авторизован
- Отображает children если авторизован

Использование:
<ProtectedRoute>
  <Profile />
</ProtectedRoute>
```

**Navbar.jsx** (обновлён)
```javascript
Изменения:
- Использует useAuth() для получения состояния
- Условное отображение меню:
  
  Если НЕ авторизован:
  - Кнопка "Вход" (LogIn иконка)
  - Кнопка "Регистрация" (жёлтая, User иконка)
  
  Если авторизован:
  - Кнопка "Профиль" с username (User иконка)
  - Кнопка "Выход" (LogOut иконка)

- Функция handleLogout() для выхода
- Адаптивный дизайн для мобильных устройств
```

#### 4. **Routing**

**App.jsx** (обновлён)
```javascript
Новые маршруты:
- /login - Login страница (публичная)
- /register - Register страница (публичная)
- /profile - Profile страница (защищённая с ProtectedRoute)

Обёрнуто в AuthProvider:
main.jsx содержит:
<AuthProvider>
  <App />
</AuthProvider>
```

---

## 🔒 Безопасность

### 1. **Password Security**
- Хеширование: BCrypt (cost factor: default 10)
- Salt: Автоматически генерируется BCrypt
- Никогда не хранятся в plain text

### 2. **JWT Security**
- Secret Key: 64+ символов
- Algorithm: HS256 (HMAC-SHA256)
- Expiration: 24 часа
- Хранится в localStorage (можно улучшить до httpOnly cookies)

### 3. **CORS Protection**
- Разрешены только определённые origins
- Credentials: true
- Разрешённые методы: GET, POST, PUT, DELETE, OPTIONS

### 4. **Input Validation**
- Frontend: Минимальная длина, формат email, совпадение паролей
- Backend: @Valid аннотации, проверка на существование username/email
- SQL Injection: защита через JPA и параметризованные запросы

---

## 📊 Схема работы

### Регистрация
```
1. User заполняет форму на /register
2. Frontend валидирует данные (password rules)
3. POST /api/auth/register
4. Backend проверяет username/email на уникальность
5. Хеширование пароля с BCrypt
6. Сохранение User в БД
7. Генерация JWT токена
8. Возврат токена + user data
9. Frontend сохраняет токен в localStorage
10. Автоматический редирект на главную
```

### Вход
```
1. User заполняет форму на /login
2. POST /api/auth/login
3. Backend проверяет credentials
4. AuthenticationManager валидирует
5. Генерация JWT токена
6. Возврат токена + user data
7. Frontend сохраняет токен в localStorage
8. Редирект на главную
```

### Защищённые запросы
```
1. User делает запрос к защищённому API
2. Axios interceptor добавляет заголовок:
   Authorization: Bearer <token>
3. JwtRequestFilter извлекает токен
4. Валидация токена
5. Установка Authentication в SecurityContext
6. Обработка запроса контроллером
7. Возврат данных
```

### Выход
```
1. User нажимает "Выход"
2. logout() удаляет токен из localStorage
3. Очистка состояния user
4. Редирект на главную
```

---

## 🎯 Использование

### Frontend

#### Использование AuthContext в компонентах
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (isAuthenticated) {
    return <div>Привет, {user.username}!</div>;
  }
  
  return <div>Пожалуйста, войдите</div>;
}
```

#### Защита маршрутов
```javascript
import ProtectedRoute from './components/ProtectedRoute';

<Route path="/profile" element={
  <ProtectedRoute>
    <Profile />
  </ProtectedRoute>
} />
```

#### Авторизованные запросы
```javascript
import axios from 'axios';

// Токен автоматически добавляется interceptor'ом
const response = await axios.get('http://localhost:8080/api/profile/me');
```

### Backend

#### Защита эндпоинтов
```java
// В SecurityConfig.java уже настроено:
.requestMatchers("/api/auth/**").permitAll()  // Публичные
.anyRequest().authenticated()                  // Требуют токен

// Или используйте аннотации:
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/admin/users")
public List<User> getAllUsers() {
    // Только для администраторов
}
```

#### Получение текущего пользователя
```java
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

Authentication auth = SecurityContextHolder.getContext().getAuthentication();
String username = auth.getName();
```

---

## 🚀 Запуск

### 1. Backend
```bash
cd movie-aggregator-backend
./mvnw spring-boot:run
```
Запустится на http://localhost:8080

### 2. Frontend
```bash
cd movie-aggregator-frontend
npm install axios  # Если ещё не установлен
npm run dev
```
Запустится на http://localhost:3001

### 3. Тестовый аккаунт
```
Username: demo
Password: demo123
```
(Нужно создать в БД или использовать регистрацию)

---

## 🗄️ База данных

### PostgreSQL Setup

1. Создайте базу данных:
```sql
CREATE DATABASE movie_aggregator;
```

2. Настройте application.properties:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/movie_aggregator
spring.datasource.username=postgres
spring.datasource.password=your_password
```

3. Таблица users создастся автоматически (Hibernate DDL)

### Создание тестового пользователя (SQL)
```sql
INSERT INTO users (username, email, password, role, level, registration_date, total_reviews, total_ratings, reputation)
VALUES (
  'demo',
  'demo@cinemahub.com',
  '$2a$10$sampleBCryptHashHere', -- Используйте реальный BCrypt hash
  'USER',
  'NOVICE',
  NOW(),
  0,
  0,
  0
);
```

Или используйте регистрацию через UI!

---

## 📝 Возможные улучшения

### Безопасность
- [ ] HttpOnly cookies вместо localStorage для токенов
- [ ] Refresh tokens (для автоматического продления сессии)
- [ ] Rate limiting на эндпоинты /login и /register
- [ ] 2FA (Two-Factor Authentication)
- [ ] Password reset функциональность
- [ ] Email verification при регистрации
- [ ] CAPTCHA на форме регистрации

### Функциональность
- [ ] "Запомнить меня" (Remember Me)
- [ ] Социальные логины (Google, Facebook, GitHub)
- [ ] История входов
- [ ] Управление сессиями (logout from all devices)
- [ ] Профиль пользователя с возможностью редактирования
- [ ] Смена пароля
- [ ] Удаление аккаунта

### UX
- [ ] Индикатор силы пароля
- [ ] Автозаполнение username при регистрации
- [ ] Показ времени до истечения токена
- [ ] Плавные переходы между страницами
- [ ] Toast уведомления об успешных действиях

---

## 🎉 Готово!

Система регистрации и авторизации полностью функциональна:
- ✅ JWT аутентификация
- ✅ Регистрация новых пользователей
- ✅ Вход существующих пользователей
- ✅ Защита маршрутов
- ✅ Автоматическое добавление токенов к запросам
- ✅ Валидация форм
- ✅ Красивый UI в стиле CinemaHub
- ✅ Адаптивный дизайн
- ✅ Обработка ошибок

**Теперь пользователи могут регистрироваться, входить и пользоваться защищёнными функциями!** 🔐🎬
