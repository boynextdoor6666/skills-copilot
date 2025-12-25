# 🎯 План расширения до уровня Metacritic

## Обзор архитектуры Metacritic

Metacritic - это огромная платформа с множеством функций. Вот полный план реализации:

---

## 📊 1. Расширенная система рейтингов (ПРИОРИТЕТ 1)

### Metascore (0-100)
```javascript
// Цветовая кодировка как у Metacritic
const getMetascoreColor = (score) => {
  if (score >= 75) return 'green' // #00CE7A
  if (score >= 50) return 'yellow' // #FFBD3F
  return 'red' // #FF6874
}
```

### Структура рейтингов:
- **Metascore**: Средневзвешенный рейтинг от критиков (0-100)
- **User Score**: Рейтинг пользователей (0-10, отображается 0.0-10.0)
- **Critics Reviews**: 
  - Positive (зелёные)
  - Mixed (жёлтые)
  - Negative (красные)
- **User Reviews**: Аналогично критикам

### Компоненты для создания:
1. `MetascoreBadge.jsx` - Большой badge с цветом
2. `UserScoreBadge.jsx` - Оценка пользователей
3. `ReviewDistribution.jsx` - График распределения отзывов
4. `ReviewSummary.jsx` - Краткая статистика

---

## 🎮 2. Страницы по платформам (ПРИОРИТЕТ 2)

### Структура:
```
/games/playstation-5
/games/xbox-series-x
/games/pc
/games/nintendo-switch
/games/mobile
```

### Компоненты:
- **PlatformPage.jsx**: Главная страница платформы
- **PlatformFilter.jsx**: Фильтры по эксклюзивам, жанрам
- **PlatformNews.jsx**: Новости платформы
- **UpcomingReleases.jsx**: Скоро выйдет

### Данные:
```javascript
{
  platform: {
    id: 'ps5',
    name: 'PlayStation 5',
    icon: '/icons/ps5.svg',
    exclusives: [...],
    topRated: [...],
    newReleases: [...]
  }
}
```

---

## 📝 3. Система профессиональных рецензий (ПРИОРИТЕТ 1)

### Модель CriticReview:
```java
@Entity
public class CriticReview {
    private Long id;
    private Long movieId;
    private String publicationName; // IGN, GameSpot, etc.
    private String criticName;
    private String excerpt; // Цитата
    private String fullReviewUrl;
    private Integer score; // 0-100
    private String grade; // A+, B-, etc.
    private Date publishDate;
    private ReviewType type; // POSITIVE, MIXED, NEGATIVE
}
```

### Компоненты:
- `CriticReviewCard.jsx` - Карточка рецензии
- `CriticReviewList.jsx` - Список всех рецензий
- `ReviewSource.jsx` - Логотип и название источника

### Источники (примеры):
- **Игры**: IGN, GameSpot, Polygon, Eurogamer, PC Gamer
- **Фильмы**: Roger Ebert, Empire, Total Film, Variety
- **Сериалы**: AV Club, TV Guide, Entertainment Weekly

---

## 💬 4. Расширенные пользовательские отзывы (ПРИОРИТЕТ 2)

### Модель UserReview (расширенная):
```java
@Entity
public class UserReview {
    private Long id;
    private Long userId;
    private Long contentId;
    private String title;
    private String content; // До 5000 символов
    private Double score; // 0-10
    private Boolean containsSpoilers;
    private Integer helpfulCount;
    private Integer notHelpfulCount;
    private ReviewStatus status; // PENDING, APPROVED, REJECTED
    private Date createdAt;
    private Date updatedAt;
    
    // Детальные оценки
    private Map<String, Double> detailedRatings; 
    // gameplay, story, graphics, sound, value
}
```

### Функции:
- Голосование (Helpful / Not Helpful)
- Отметка спойлеров
- Сортировка (Most Helpful, Most Recent, Highest Score, Lowest Score)
- Модерация
- Ответы на отзывы
- Редактирование (в течение 24 часов)

### Компоненты:
- `UserReviewCard.jsx`
- `ReviewForm.jsx`
- `ReviewVoting.jsx`
- `SpoilerWarning.jsx`

---

## 📅 5. Coming Soon / Предстоящие релизы (ПРИОРИТЕТ 3)

### Структура страницы:
```javascript
{
  title: "Предстоящие релизы",
  filters: {
    timeframe: ['This Week', 'This Month', 'This Quarter', 'This Year'],
    platform: ['All', 'PS5', 'Xbox', 'PC', 'Switch'],
    type: ['Games', 'Movies', 'TV Shows']
  },
  items: [
    {
      title: "Grand Theft Auto VI",
      releaseDate: "2025-10-15",
      platforms: ['PS5', 'Xbox Series X'],
      expectedScore: 95, // Прогноз на основе предыдущих игр
      trailers: [...],
      screenshots: [...],
      watchlist: 1250000 // Количество отслеживающих
    }
  ]
}
```

### Функции:
- Календарь релизов
- Система отслеживания (Watchlist)
- Email/Push уведомления о релизе
- Трейлеры и скриншоты
- Pre-order ссылки

---

## 📰 6. Новости и статьи (ПРИОРИТЕТ 3)

### Модель News:
```java
@Entity
public class NewsArticle {
    private Long id;
    private String title;
    private String slug;
    private String excerpt;
    private String content; // Markdown/HTML
    private String coverImage;
    private String author;
    private NewsCategory category;
    private List<Tag> tags;
    private Date publishedAt;
    private Integer views;
    private Integer commentsCount;
}

enum NewsCategory {
    REVIEWS,
    PREVIEWS,
    FEATURES,
    INTERVIEWS,
    NEWS,
    EDITORIALS
}
```

### Разделы:
- **Reviews** - Обзоры
- **Previews** - Превью будущих релизов
- **Features** - Большие статьи
- **Interviews** - Интервью с разработчиками/актёрами
- **News** - Новости индустрии
- **Editorials** - Редакционные колонки

---

## 🔍 7. Расширенный поиск (ПРИОРИТЕТ 2)

### Параметры поиска:

#### Для игр:
- Название, разработчик, издатель
- Платформа (PS5, Xbox, PC, Switch, Mobile)
- Жанр и поджанры
- Год выпуска (диапазон)
- Metascore (диапазон)
- User Score (диапазон)
- Количество игроков (Single, Co-op, Multiplayer)
- ESRB рейтинг (E, T, M)
- Теги (Open World, RPG, Indie, etc.)

#### Для фильмов:
- Название, режиссёр, актёры
- Год, длительность
- Жанр, страна
- Рейтинг критиков/зрителей
- Кассовые сборы
- Награды (Oscar, Golden Globe)

#### Для сериалов:
- Название, создатель, сеть
- Год, количество сезонов
- Статус (Ongoing, Ended, Cancelled)
- Жанр

### Компоненты:
- `AdvancedSearchForm.jsx`
- `SearchFilters.jsx`
- `SearchResults.jsx`
- `SavedSearches.jsx`

---

## 📋 8. Списки и коллекции (ПРИОРИТЕТ 3)

### Типы списков:

#### Официальные:
- **Best of 2025** - Лучшие года
- **All-Time Greats** - Лучшие всех времён
- **Most Discussed** - Самые обсуждаемые
- **Trending Now** - Сейчас в тренде
- **Staff Picks** - Выбор редакции

#### Пользовательские:
- Создание своих списков
- Публичные/Приватные
- Совместные списки
- Экспорт/Импорт

### Модель List:
```java
@Entity
public class ContentList {
    private Long id;
    private String name;
    private String description;
    private Long userId;
    private ListType type; // USER, EDITORIAL
    private Boolean isPublic;
    private List<ListItem> items;
    private Integer followersCount;
    private Date createdAt;
}
```

---

## 🎬 9. Детальные страницы контента (ПРИОРИТЕТ 1)

### Структура детальной страницы игры:

```javascript
{
  hero: {
    coverImage: "...",
    logo: "...",
    trailer: "..."
  },
  
  scores: {
    metascore: 92,
    userScore: 8.7,
    criticsReviews: { positive: 45, mixed: 3, negative: 0 },
    userReviews: { positive: 1200, mixed: 150, negative: 50 }
  },
  
  details: {
    developer: "Rockstar North",
    publisher: "Rockstar Games",
    platforms: ["PS5", "Xbox Series X"],
    releaseDate: "2025-10-15",
    genre: ["Action", "Open World"],
    esrbRating: "M",
    players: "1-30 Online"
  },
  
  media: {
    trailers: [...],
    screenshots: [...],
    gameplay: [...]
  },
  
  technicalInfo: {
    systemRequirements: {
      minimum: {...},
      recommended: {...}
    },
    fileSize: "150 GB",
    languages: [...]
  },
  
  dlc: [...],
  updates: [...],
  
  similarGames: [...]
}
```

### Секции:
1. **Hero Section** - Обложка, логотип, трейлер
2. **Score Section** - Все рейтинги
3. **Details** - Основная информация
4. **Summary** - Краткое описание
5. **Critics Reviews** - Рецензии критиков
6. **User Reviews** - Отзывы пользователей
7. **Media Gallery** - Фото и видео
8. **Technical Info** - Системные требования
9. **DLC & Updates** - Дополнения
10. **Similar Content** - Похожий контент

---

## 🏆 10. Система наград (ПРИОРИТЕТ 4)

### Типы наград:

#### Игры:
- The Game Awards
- Golden Joystick Awards
- BAFTA Games Awards
- DICE Awards
- GDC Awards

#### Фильмы:
- Academy Awards (Oscars)
- Golden Globes
- BAFTA
- Critics Choice
- Cannes, Venice, Berlin

#### Сериалы:
- Emmy Awards
- Golden Globes
- SAG Awards
- Critics Choice TV

### Модель Award:
```java
@Entity
public class Award {
    private Long id;
    private String name;
    private String category;
    private Integer year;
    private Long contentId;
    private AwardStatus status; // NOMINATED, WON
    private String ceremony;
}
```

---

## 💬 11. Форумы и обсуждения (ПРИОРИТЕТ 4)

### Структура форума:
```
/forums
  /games
    /gta-vi
      - General Discussion
      - Tips & Tricks
      - Multiplayer
      - Bug Reports
  /movies
  /tv-shows
```

### Функции:
- Создание тредов
- Ответы и цитирование
- Репутация пользователей
- Модерация
- Теги и поиск
- Уведомления

---

## 🔗 12. API интеграции (ПРИОРИТЕТ 2)

### Внешние API:

#### Игры:
- **RAWG API** - База данных игр
- **IGDB API** - Данные об играх
- **Steam API** - Информация Steam
- **PlayStation API** - PS Store
- **Xbox API** - Xbox Store

#### Фильмы/Сериалы:
- **TMDB API** - The Movie Database
- **OMDb API** - Open Movie Database
- **TVMaze API** - Данные о сериалах

#### Цены:
- **IsThereAnyDeal** - Сравнение цен на игры
- **CheapShark** - Скидки на игры

---

## 📱 13. Дополнительные функции

### Профиль пользователя:
- История активности
- Библиотека (игры/фильмы/сериалы)
- Списки (Completed, Playing, Want to Play)
- Статистика
- Друзья и подписки
- Достижения

### Социальные функции:
- Подписка на пользователей
- Лента активности
- Рекомендации от друзей
- Сравнение библиотек

### Персонализация:
- Рекомендации на основе вкусов
- Персональный Metascore
- Уведомления о релизах любимых франшиз
- Email дайджесты

---

## 🎨 14. UI/UX улучшения

### Компоненты в стиле Metacritic:
1. **MetascoreBox** - Большой квадрат с оценкой
2. **ReviewDistribution** - График распределения
3. **TabNavigation** - Вкладки (Overview, Details, Reviews, Media)
4. **PlatformIcons** - Иконки платформ
5. **GenreTags** - Теги жанров
6. **ReleaseCalendar** - Календарь релизов
7. **ComparisonTool** - Сравнение игр/фильмов

### Цветовая схема Metacritic:
```css
/* Metascore colors */
--metacritic-green: #00CE7A;
--metacritic-yellow: #FFBD3F;
--metacritic-red: #FF6874;

/* UI colors */
--mc-dark: #1C1C1C;
--mc-darker: #0F0F0F;
--mc-gray: #404040;
--mc-light-gray: #808080;
```

---

## 📊 15. Backend архитектура

### Дополнительные Entity:

```java
// Critic (Критик)
@Entity
public class Critic {
    private Long id;
    private String name;
    private String publication;
    private String bio;
    private String avatarUrl;
    private Double averageScore;
    private Integer totalReviews;
}

// Publication (Издание)
@Entity
public class Publication {
    private Long id;
    private String name;
    private String website;
    private String logo;
    private PublicationType type;
    private Double credibilityScore;
}

// Platform (Платформа)
@Entity
public class Platform {
    private Long id;
    private String name;
    private String shortName;
    private String icon;
    private PlatformType type; // CONSOLE, PC, MOBILE
    private String manufacturer;
}

// Release (Релиз)
@Entity
public class Release {
    private Long id;
    private Long contentId;
    private Long platformId;
    private Date releaseDate;
    private String region; // NA, EU, JP
    private ReleaseType type; // PHYSICAL, DIGITAL, BOTH
}
```

---

## 🚀 Порядок реализации (Roadmap)

### Фаза 1 (Неделя 1-2):
1. ✅ Расширенная система рейтингов Metacritic
2. ✅ Детальные страницы контента
3. ✅ Система профессиональных рецензий

### Фаза 2 (Неделя 3-4):
4. Расширенные пользовательские отзывы
5. Расширенный поиск и фильтры
6. Страницы по платформам

### Фаза 3 (Неделя 5-6):
7. Coming Soon страница
8. Списки и коллекции
9. API интеграции (RAWG, TMDB)

### Фаза 4 (Неделя 7-8):
10. Новости и статьи
11. Система наград
12. Форумы и обсуждения

### Фаза 5 (Неделя 9-10):
13. Расширенный профиль пользователя
14. Социальные функции
15. Персонализация и рекомендации

---

## 📈 Метрики успеха

### KPI:
- **Контент**: 20K+ игр, 50K+ фильмов, 10K+ сериалов
- **Рецензии**: 100K+ профессиональных, 1M+ пользовательских
- **Пользователи**: 100K+ активных
- **Engagement**: 10+ минут средняя сессия
- **Retention**: 40%+ monthly retention

---

## 💾 Технические требования

### Frontend:
- React 18 с TypeScript
- React Query для кэширования
- Redux Toolkit для state management
- React Router v6
- Axios для API запросов
- Chart.js для графиков

### Backend:
- Spring Boot 3.2
- PostgreSQL 14+
- Redis для кэширования
- Elasticsearch для поиска
- RabbitMQ для очередей
- Docker для контейнеризации

### Infrastructure:
- AWS/Azure/GCP
- CDN для статики
- Load Balancer
- Auto-scaling
- Monitoring (Prometheus, Grafana)

---

**CinemaHub Metacritic Edition** - Полнофункциональный агрегатор мирового уровня! 🎮🎬📺
