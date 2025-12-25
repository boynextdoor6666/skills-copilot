# 🔧 Устранение ошибки "ERR_CONNECTION_REFUSED"

## Проблема
```
POST http://localhost:8080/api/auth/login net::ERR_CONNECTION_REFUSED
```

**Причина:** Backend сервер не запущен.

---

## ✅ Решение (пошагово)

### Шаг 1: Проверить .env файл

Откройте `movie-aggregator-backend-nest/.env` и убедитесь, что он содержит:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=ваш_пароль_mysql
DB_NAME=warehouse
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

Если файла нет, создайте его!

### Шаг 2: Импортировать SQL процедуры (если ещё не сделали)

```powershell
cd "C:\Users\user\Desktop\Course work (agregator)\movie-aggregator-backend-nest\database"

# Импортировать схему и процедуры
cmd /c "\"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe\" -u root -p -D warehouse < schema-additions.sql"
cmd /c "\"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe\" -u root -p -D warehouse < admin-procedures.sql"
cmd /c "\"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe\" -u root -p -D warehouse < critic-procedures.sql"
cmd /c "\"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe\" -u root -p -D warehouse < visitor-procedures.sql"
cmd /c "\"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe\" -u root -p -D warehouse < viewer-user-procedures.sql"
```

### Шаг 3: Запустить Backend

#### Вариант A: Двойной клик на батник (рекомендуется)
```
Двойной клик на start-backend-nest.bat
```

#### Вариант B: Вручную через PowerShell
```powershell
cd "C:\Users\user\Desktop\Course work (agregator)\movie-aggregator-backend-nest"
npm install  # если ещё не установлены зависимости
npm run start:dev
```

### Шаг 4: Проверить, что backend запустился

Должны увидеть в консоли:
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] INFO [RoutesResolver] ContentController {/api/content}:
[Nest] INFO [RoutesResolver] ReviewsController {/api/reviews}:
[Nest] INFO [RoutesResolver] Mapped {/api/content/search, GET} route
[Nest] INFO [NestApplication] Nest application successfully started
```

### Шаг 5: Открыть браузер и проверить

- **Swagger UI:** http://localhost:8080/swagger
- **API Health:** http://localhost:8080/api/auth/validate (должно вернуть 401 Unauthorized — это нормально)

---

## 🎯 После запуска backend

### Тестирование регистрации и входа

1. Откройте фронтенд: http://localhost:5173
2. Перейдите на страницу **Регистрация**
3. Заполните форму:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `test123`
4. Нажмите **Зарегистрироваться**
5. После успешной регистрации вы будете перенаправлены на страницу входа
6. Войдите с теми же данными
7. **Личный кабинет появится в навигационной панели!**

### Что вы увидите после входа:

Навбар покажет:
```
[Логотип] [Главная] [Фильмы] [Сериалы] [Игры] [Скоро выйдет] | [testuser ▼] [Выход]
```

При клике на `testuser` откроется страница профиля: `/profile`

---

## 🐛 Troubleshooting

### Backend не запускается

**Ошибка:** `Cannot find module '@nestjs/core'`
```powershell
cd movie-aggregator-backend-nest
npm install
```

**Ошибка:** `Unable to connect to the database`
1. Проверить, что MySQL запущен:
   ```powershell
   Get-Service -Name "MySQL*"
   ```
2. Проверить `.env` (DB_HOST, DB_PASS, DB_NAME)
3. Проверить подключение вручную:
   ```powershell
   & 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' -u root -p -D warehouse -e "SELECT 1;"
   ```

**Ошибка:** `PROCEDURE does not exist`
→ Импортируйте SQL процедуры (Шаг 2)

### Frontend показывает ошибку после входа

**Ошибка:** `401 Unauthorized` на /api/auth/validate
- Проверьте, что JWT_SECRET одинаковый в `.env` и не менялся после регистрации
- Очистите localStorage в браузере: DevTools → Application → Local Storage → Clear

**Ошибка:** Личный кабинет не появляется в навбаре
- Откройте DevTools → Console
- Проверьте, что `user` и `isAuthenticated` установлены:
  ```javascript
  localStorage.getItem('token')  // должен вернуть JWT токен
  ```
- Перезагрузите страницу (F5)

---

## 📱 Функциональность личного кабинета

После успешного входа в навигации появится:

### Для обычного пользователя (USER):
- **[Username]** → клик ведёт на `/profile`
  - Просмотр профиля
  - Редактирование bio, аватара
  - Статистика отзывов
  - Смена пароля

### Для критика (CRITIC):
- **[Username]** → `/profile`
- Дополнительные функции:
  - Публикация профессиональных отзывов
  - Аналитика рейтингов

### Для администратора (ADMIN):
- **[🛡️ Админ]** → `/admin`
- **[Username]** → `/profile`
- Панель управления:
  - Валидация критиков
  - Блокировка пользователей
  - Управление контентом

---

## ✅ Готово!

После выполнения этих шагов:
1. ✅ Backend запущен на http://localhost:8080
2. ✅ Регистрация и вход работают
3. ✅ Личный кабинет отображается в навбаре после входа
4. ✅ Можно добавлять отзывы и использовать все функции системы

🎉 Система полностью работает!
