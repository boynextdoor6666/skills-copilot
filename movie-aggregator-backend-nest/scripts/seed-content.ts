import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Content, ContentType } from '../src/content/entities/content.entity';

dotenv.config();

const sampleContent = [
  // MOVIES
  {
    title: 'Начало',
    content_type: ContentType.MOVIE,
    release_year: 2010,
    genre: 'Фантастика, Боевик',
    description: 'Вор, крадущий корпоративные секреты с помощью технологии совместного сновидения, получает обратную задачу — внедрить идею в разум генерального директора.',
    poster_url: 'https://image.tmdb.org/t/p/w500/9gk7admal4zlWH9AJ46r878Xmmy.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
    director: 'Кристофер Нолан',
    director_photo_url: 'https://image.tmdb.org/t/p/w200/xuAI429D1lUcuI4IocXJkP9TEjb.jpg',
    cast: 'Леонардо ДиКаприо, Джозеф Гордон-Левитт, Эллиот Пейдж, Том Харди',
    cast_photos: [
      'https://image.tmdb.org/t/p/w200/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg', // Leo
      'https://image.tmdb.org/t/p/w200/4GiXU59r8125bXv1e3Xh1X2kTyB.jpg', // JGL
      'https://image.tmdb.org/t/p/w200/tp157uL7gV52I772o7h5F91C5.jpg', // Elliot
      'https://image.tmdb.org/t/p/w200/yVgfB4v15lFai0g3tX2t9f1.jpg'  // Hardy
    ],
    runtime: 148,
    avg_rating: 8.8,
    critics_rating: 8.7,
    audience_rating: 9.1,
    hype_index: 95,
    emotional_cloud: { awe: 90, tension: 85, excitement: 80, joy: 20 },
    perception_map: { plot: 10, acting: 9, visuals: 10, soundtrack: 10, originality: 10 }
  },
  {
    title: 'Дюна: Часть вторая',
    content_type: ContentType.MOVIE,
    release_year: 2024,
    genre: 'Фантастика, Приключения',
    description: 'Пол Атрейдес объединяется с Чани и фрименами, чтобы отомстить заговорщикам, уничтожившим его семью.',
    poster_url: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    director: 'Дени Вильнёв',
    director_photo_url: 'https://image.tmdb.org/t/p/w200/t7X9kZk2k2k2k2k2k2k2k2k2k2.jpg', // Placeholder-ish
    cast: 'Тимоти Шаламе, Зендея, Ребекка Фергюсон, Хавьер Бардем',
    cast_photos: [
      'https://image.tmdb.org/t/p/w200/BE2sdjpgEHRr95lB3xOgx0W8e.jpg',
      'https://image.tmdb.org/t/p/w200/r3A7ev7Qkj51Yk01.jpg',
      'https://image.tmdb.org/t/p/w200/lJloTOheuQSirSLXNA3JHsrMNfH.jpg',
      'https://image.tmdb.org/t/p/w200/gGj9D2I3K7.jpg'
    ],
    runtime: 166,
    avg_rating: 8.9,
    critics_rating: 9.0,
    audience_rating: 9.2,
    hype_index: 98,
    emotional_cloud: { awe: 95, tension: 80, excitement: 90, joy: 30 },
    perception_map: { plot: 9, acting: 9, visuals: 10, soundtrack: 10, originality: 8 }
  },
  {
    title: 'Оппенгеймер',
    content_type: ContentType.MOVIE,
    release_year: 2023,
    genre: 'Биография, Драма',
    description: 'История американского ученого Дж. Роберта Оппенгеймера и его роли в создании атомной бомбы.',
    poster_url: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    director: 'Кристофер Нолан',
    director_photo_url: 'https://image.tmdb.org/t/p/w200/xuAI429D1lUcuI4IocXJkP9TEjb.jpg',
    cast: 'Киллиан Мёрфи, Эмили Блант, Мэтт Дэймон, Роберт Дауни мл.',
    cast_photos: [
      'https://image.tmdb.org/t/p/w200/3W1.jpg',
      'https://image.tmdb.org/t/p/w200/nPJ.jpg',
      'https://image.tmdb.org/t/p/w200/elq.jpg',
      'https://image.tmdb.org/t/p/w200/5qH.jpg'
    ],
    runtime: 180,
    avg_rating: 8.6,
    critics_rating: 9.3,
    audience_rating: 8.9,
    hype_index: 92,
    emotional_cloud: { awe: 80, tension: 90, excitement: 60, joy: 10 },
    perception_map: { plot: 9, acting: 10, visuals: 9, soundtrack: 10, originality: 9 }
  },
  {
    title: 'Интерстеллар',
    content_type: ContentType.MOVIE,
    release_year: 2014,
    genre: 'Фантастика, Драма',
    description: 'Команда исследователей отправляется в путешествие через червоточину в космосе, чтобы найти новый дом для человечества.',
    poster_url: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    director: 'Кристофер Нолан',
    director_photo_url: 'https://image.tmdb.org/t/p/w200/xuAI429D1lUcuI4IocXJkP9TEjb.jpg',
    cast: 'Мэттью МакКонахи, Энн Хэтэуэй, Джессика Честейн',
    cast_photos: [],
    runtime: 169,
    avg_rating: 8.7,
    critics_rating: 8.5,
    audience_rating: 9.0,
    hype_index: 94,
    emotional_cloud: { awe: 95, sadness: 80, tension: 70, joy: 40 },
    perception_map: { plot: 9, acting: 9, visuals: 10, soundtrack: 10, originality: 9 }
  },
  {
    title: 'Побег из Шоушенка',
    content_type: ContentType.MOVIE,
    release_year: 1994,
    genre: 'Драма',
    description: 'Бухгалтер Энди Дюфрейн, обвиненный в убийстве собственной жены и ее любовника, оказывается в тюрьме Шоушенк.',
    poster_url: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=6hB3S9bIaco',
    director: 'Фрэнк Дарабонт',
    director_photo_url: '',
    cast: 'Тим Роббинс, Морган Фриман',
    cast_photos: [],
    runtime: 142,
    avg_rating: 9.3,
    critics_rating: 9.5,
    audience_rating: 9.8,
    hype_index: 88,
    emotional_cloud: { sadness: 60, joy: 70, tension: 50, awe: 80 },
    perception_map: { plot: 10, acting: 10, visuals: 8, soundtrack: 9, originality: 9 }
  },
  {
    title: 'Темный рыцарь',
    content_type: ContentType.MOVIE,
    release_year: 2008,
    genre: 'Боевик, Криминал',
    description: 'Бэтмен поднимает ставки в войне с криминалом. С помощью лейтенанта Джима Гордона и прокурора Харви Дента он намерен очистить улицы от преступности.',
    poster_url: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
    director: 'Кристофер Нолан',
    director_photo_url: '',
    cast: 'Кристиан Бэйл, Хит Леджер, Аарон Экхарт',
    cast_photos: [],
    runtime: 152,
    avg_rating: 9.0,
    critics_rating: 9.4,
    audience_rating: 9.6,
    hype_index: 96,
    emotional_cloud: { tension: 90, excitement: 95, awe: 85, joy: 20 },
    perception_map: { plot: 9, acting: 10, visuals: 9, soundtrack: 9, originality: 9 }
  },
  {
    title: 'Криминальное чтиво',
    content_type: ContentType.MOVIE,
    release_year: 1994,
    genre: 'Криминал, Драма',
    description: 'Несколько связанных историй из жизни двух наемных убийц, боксера, жены гангстера и пары грабителей.',
    poster_url: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=s7EdQ4FqbhY',
    director: 'Квентин Тарантино',
    director_photo_url: '',
    cast: 'Джон Траволта, Ума Турман, Сэмюэл Л. Джексон',
    cast_photos: [],
    runtime: 154,
    avg_rating: 8.9,
    critics_rating: 9.2,
    audience_rating: 9.1,
    hype_index: 91,
    emotional_cloud: { joy: 60, tension: 70, surprise: 80, excitement: 75 },
    perception_map: { plot: 10, acting: 9, visuals: 8, soundtrack: 10, originality: 10 }
  },
  {
    title: 'Матрица',
    content_type: ContentType.MOVIE,
    release_year: 1999,
    genre: 'Фантастика, Боевик',
    description: 'Хакер Нео узнает от таинственных повстанцев, что мир, который он считает реальностью, на самом деле — симуляция.',
    poster_url: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=m8e-FF8MsqU',
    director: 'Лана Вачовски, Лилли Вачовски',
    director_photo_url: '',
    cast: 'Киану Ривз, Лоренс Фишбёрн, Кэрри-Энн Мосс',
    cast_photos: [],
    runtime: 136,
    avg_rating: 8.7,
    critics_rating: 8.8,
    audience_rating: 9.0,
    hype_index: 93,
    emotional_cloud: { awe: 95, excitement: 90, tension: 80, surprise: 85 },
    perception_map: { plot: 10, acting: 8, visuals: 10, soundtrack: 9, originality: 10 }
  },
  {
    title: 'Властелин колец: Братство Кольца',
    content_type: ContentType.MOVIE,
    release_year: 2001,
    genre: 'Фэнтези, Приключения',
    description: 'Хоббит Фродо Бэггинс отправляется в поход, чтобы уничтожить Кольцо Всевластия и спасти Средиземье.',
    poster_url: 'https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=V75dMMIW2B4',
    director: 'Питер Джексон',
    director_photo_url: '',
    cast: 'Элайджа Вуд, Иэн Маккеллен, Вигго Мортенсен',
    cast_photos: [],
    runtime: 178,
    avg_rating: 8.8,
    critics_rating: 9.1,
    audience_rating: 9.3,
    hype_index: 97,
    emotional_cloud: { awe: 100, excitement: 90, tension: 80, joy: 50 },
    perception_map: { plot: 10, acting: 9, visuals: 10, soundtrack: 10, originality: 9 }
  },
  {
    title: 'Бойцовский клуб',
    content_type: ContentType.MOVIE,
    release_year: 1999,
    genre: 'Драма',
    description: 'Страдающий бессонницей офисный клерк встречает харизматичного торговца мылом Тайлера Дердена.',
    poster_url: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=qtRKdVHc-cE',
    director: 'Дэвид Финчер',
    director_photo_url: '',
    cast: 'Эдвард Нортон, Брэд Питт, Хелена Бонем Картер',
    cast_photos: [],
    runtime: 139,
    avg_rating: 8.8,
    critics_rating: 8.5,
    audience_rating: 9.4,
    hype_index: 90,
    emotional_cloud: { tension: 85, surprise: 95, excitement: 80, joy: 30 },
    perception_map: { plot: 10, acting: 10, visuals: 9, soundtrack: 8, originality: 10 }
  },

  // TV SERIES
  {
    title: 'Во все тяжкие',
    content_type: ContentType.TV_SERIES,
    release_year: 2008,
    genre: 'Криминал, Драма',
    description: 'Школьный учитель химии, ставший производителем метамфетамина, встает на путь преступлений, чтобы обеспечить финансовое будущее своей семьи.',
    poster_url: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=HhesaQXLuRY',
    director: 'Винс Гиллиган', // Creator
    director_photo_url: 'https://image.tmdb.org/t/p/w200/z3E.jpg',
    cast: 'Брайан Крэнстон, Аарон Пол, Анна Ганн',
    cast_photos: [
      'https://image.tmdb.org/t/p/w200/7J.jpg',
      'https://image.tmdb.org/t/p/w200/u8.jpg',
      'https://image.tmdb.org/t/p/w200/ad.jpg'
    ],
    runtime: 49, // avg episode
    avg_rating: 9.5,
    critics_rating: 9.8,
    audience_rating: 9.7,
    hype_index: 85,
    emotional_cloud: { tension: 95, excitement: 85, awe: 70, joy: 10 },
    perception_map: { plot: 10, acting: 10, visuals: 8, soundtrack: 8, originality: 10 }
  },
  {
    title: 'Одни из нас',
    content_type: ContentType.TV_SERIES,
    release_year: 2023,
    genre: 'Драма, Фантастика',
    description: 'После глобальной пандемии, уничтожившей цивилизацию, закаленный выживший берет под опеку 14-летнюю девочку, которая может стать последней надеждой человечества.',
    poster_url: 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhykJ9l8Jw0.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=uLtkt8BonwM',
    director: 'Крейг Мейзин',
    director_photo_url: '',
    cast: 'Педро Паскаль, Белла Рамзи',
    cast_photos: [
      'https://image.tmdb.org/t/p/w200/9f.jpg',
      'https://image.tmdb.org/t/p/w200/rT.jpg'
    ],
    runtime: 50,
    avg_rating: 8.8,
    critics_rating: 9.0,
    audience_rating: 8.7,
    hype_index: 90,
    emotional_cloud: { tension: 90, excitement: 80, awe: 75, joy: 20 },
    perception_map: { plot: 9, acting: 9, visuals: 9, soundtrack: 8, originality: 8 }
  },
  {
    title: 'Игра престолов',
    content_type: ContentType.TV_SERIES,
    release_year: 2011,
    genre: 'Фэнтези, Драма',
    description: 'Девять благородных семейств борются за контроль над землями Вестероса, в то время как древний враг возвращается после тысячелетнего сна.',
    poster_url: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbGw83trZrcr5uk.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=gcTkNV5Vg1E',
    director: 'Дэвид Бениофф, Д.Б. Уайсс',
    director_photo_url: '',
    cast: 'Эмилия Кларк, Кит Харингтон, Питер Динклэйдж',
    cast_photos: [],
    runtime: 57,
    avg_rating: 9.2,
    critics_rating: 9.4,
    audience_rating: 9.0,
    hype_index: 98,
    emotional_cloud: { awe: 90, tension: 95, excitement: 90, joy: 30 },
    perception_map: { plot: 9, acting: 9, visuals: 10, soundtrack: 10, originality: 9 }
  },
  {
    title: 'Чернобыль',
    content_type: ContentType.TV_SERIES,
    release_year: 2019,
    genre: 'Драма, История',
    description: 'В апреле 1986 года на Чернобыльской АЭС происходит взрыв, ставший одной из самых страшных техногенных катастроф в истории.',
    poster_url: 'https://image.tmdb.org/t/p/w500/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=s9APLXM9Ei8',
    director: 'Крейг Мейзин',
    director_photo_url: '',
    cast: 'Джаред Харрис, Стеллан Скарсгард, Эмили Уотсон',
    cast_photos: [],
    runtime: 60,
    avg_rating: 9.4,
    critics_rating: 9.6,
    audience_rating: 9.5,
    hype_index: 89,
    emotional_cloud: { sadness: 90, tension: 100, awe: 80, joy: 0 },
    perception_map: { plot: 10, acting: 10, visuals: 9, soundtrack: 9, originality: 9 }
  },
  {
    title: 'Очень странные дела',
    content_type: ContentType.TV_SERIES,
    release_year: 2016,
    genre: 'Фантастика, Ужасы',
    description: 'В 1980-х годах в тихом городке исчезает мальчик. Его друзья, семья и местная полиция ищут ответы, сталкиваясь с секретными экспериментами и сверхъестественными силами.',
    poster_url: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=b9EkMc79ZSU',
    director: 'Братья Даффер',
    director_photo_url: '',
    cast: 'Милли Бобби Браун, Финн Вулфхард, Вайнона Райдер',
    cast_photos: [],
    runtime: 50,
    avg_rating: 8.7,
    critics_rating: 8.9,
    audience_rating: 8.8,
    hype_index: 95,
    emotional_cloud: { tension: 85, excitement: 90, surprise: 80, joy: 50 },
    perception_map: { plot: 9, acting: 8, visuals: 9, soundtrack: 10, originality: 9 }
  },
  {
    title: 'Пацаны',
    content_type: ContentType.TV_SERIES,
    release_year: 2019,
    genre: 'Боевик, Комедия',
    description: 'Группа линчевателей пытается уничтожить коррумпированных супергероев, злоупотребляющих своими сверхспособностями.',
    poster_url: 'https://image.tmdb.org/t/p/w500/mY7SeH4HFFxW1hiI6eWuwCRKptN.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=06rueu_fh30',
    director: 'Эрик Крипке',
    director_photo_url: '',
    cast: 'Карл Урбан, Джек Куэйд, Энтони Старр',
    cast_photos: [],
    runtime: 60,
    avg_rating: 8.7,
    critics_rating: 8.8,
    audience_rating: 8.9,
    hype_index: 94,
    emotional_cloud: { excitement: 90, surprise: 85, joy: 60, tension: 70 },
    perception_map: { plot: 9, acting: 9, visuals: 9, soundtrack: 8, originality: 9 }
  },

  // GAMES
  {
    title: 'Ведьмак 3: Дикая Охота',
    content_type: ContentType.GAME,
    release_year: 2015,
    genre: 'RPG, Экшен',
    description: 'Вы — Геральт из Ривии, наемный охотник на чудовищ. Перед вами истерзанный войной, кишащий монстрами континент, который вы можете исследовать по своему желанию.',
    poster_url: 'https://image.tmdb.org/t/p/w500/7dl.jpg', // Placeholder
    trailer_url: 'https://www.youtube.com/watch?v=c0i88t0K2k0',
    developer: 'CD Projekt Red',
    publisher: 'CD Projekt',
    platforms: ['PC', 'PlayStation 4', 'Xbox One', 'Switch', 'PlayStation 5', 'Xbox Series X'],
    esrb_rating: 'M',
    players: 'Одиночная игра',
    file_size: '50 GB',
    avg_rating: 9.7,
    critics_rating: 9.5,
    audience_rating: 9.8,
    hype_index: 80,
    emotional_cloud: { awe: 95, excitement: 90, joy: 80, tension: 70 },
    perception_map: { gameplay: 9, graphics: 9, story: 10, soundtrack: 10, replayability: 10 }
  },
  {
    title: 'Elden Ring',
    content_type: ContentType.GAME,
    release_year: 2022,
    genre: 'RPG, Экшен',
    description: 'Восстань, Погасший, и следуй за благодатью, чтобы овладеть силой Кольца Элден и стать Владыкой Элдена в Междуземье.',
    poster_url: 'https://image.tmdb.org/t/p/w500/pic.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=E3Huy2cdih0',
    developer: 'FromSoftware',
    publisher: 'Bandai Namco',
    platforms: ['PC', 'PlayStation 4', 'PlayStation 5', 'Xbox One', 'Xbox Series X'],
    esrb_rating: 'M',
    players: 'Мультиплеер',
    file_size: '60 GB',
    avg_rating: 9.6,
    critics_rating: 9.7,
    audience_rating: 9.5,
    hype_index: 90,
    emotional_cloud: { awe: 90, tension: 95, excitement: 85, joy: 60 },
    perception_map: { gameplay: 10, graphics: 9, story: 8, soundtrack: 9, replayability: 10 }
  },
  {
    title: 'Cyberpunk 2077',
    content_type: ContentType.GAME,
    release_year: 2020,
    genre: 'RPG, Шутер',
    description: 'Cyberpunk 2077 — это приключенческая ролевая игра с открытым миром, действие которой происходит в мегаполисе Найт-Сити, где вы играете за киберпанк-наемника, втянутого в борьбу за выживание.',
    poster_url: 'https://image.tmdb.org/t/p/w500/cp2077.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=8X2kIfS6fb8',
    developer: 'CD Projekt Red',
    publisher: 'CD Projekt',
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X'],
    esrb_rating: 'M',
    players: 'Одиночная игра',
    file_size: '70 GB',
    avg_rating: 8.5,
    critics_rating: 8.0,
    audience_rating: 9.0,
    hype_index: 99,
    emotional_cloud: { awe: 85, excitement: 90, tension: 70, joy: 50 },
    perception_map: { gameplay: 8, graphics: 10, story: 9, soundtrack: 9, replayability: 8 }
  },
  {
    title: 'God of War: Ragnarök',
    content_type: ContentType.GAME,
    release_year: 2022,
    genre: 'Экшен, Приключения',
    description: 'Кратос и Атрей должны отправиться в каждое из Девяти королевств в поисках ответов, пока силы Асгарда готовятся к предсказанной битве, которая погубит мир.',
    poster_url: 'https://image.tmdb.org/t/p/w500/5.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=hfJ4Km46A-0',
    developer: 'Santa Monica Studio',
    publisher: 'Sony Interactive Entertainment',
    platforms: ['PlayStation 4', 'PlayStation 5'],
    esrb_rating: 'M',
    players: 'Одиночная игра',
    file_size: '90 GB',
    avg_rating: 9.4,
    critics_rating: 9.4,
    audience_rating: 9.5,
    hype_index: 92,
    emotional_cloud: { awe: 90, excitement: 95, tension: 80, joy: 40 },
    perception_map: { gameplay: 9, graphics: 10, story: 10, soundtrack: 10, replayability: 8 }
  },
  {
    title: 'Red Dead Redemption 2',
    content_type: ContentType.GAME,
    release_year: 2018,
    genre: 'Экшен, Приключения',
    description: 'Артур Морган и банда Ван дер Линде вынуждены бежать. По их следам идут федеральные агенты и лучшие охотники за головами в стране.',
    poster_url: 'https://image.tmdb.org/t/p/w500/2.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=eaW0tYpxyp0',
    developer: 'Rockstar Games',
    publisher: 'Rockstar Games',
    platforms: ['PC', 'PlayStation 4', 'Xbox One'],
    esrb_rating: 'M',
    players: 'Мультиплеер',
    file_size: '120 GB',
    avg_rating: 9.7,
    critics_rating: 9.7,
    audience_rating: 9.8,
    hype_index: 85,
    emotional_cloud: { awe: 95, sadness: 80, excitement: 85, joy: 50 },
    perception_map: { gameplay: 9, graphics: 10, story: 10, soundtrack: 9, replayability: 9 }
  },
  {
    title: 'Baldur\'s Gate 3',
    content_type: ContentType.GAME,
    release_year: 2023,
    genre: 'RPG',
    description: 'Соберите отряд и вернитесь в Забытые Королевства. Вас ждет история о дружбе и предательстве, выживании и самопожертвовании, а также о сладком зове абсолютной власти.',
    poster_url: 'https://image.tmdb.org/t/p/w500/1.jpg',
    trailer_url: 'https://www.youtube.com/watch?v=OcP0WdH7rTs',
    developer: 'Larian Studios',
    publisher: 'Larian Studios',
    platforms: ['PC', 'PlayStation 5', 'Xbox Series X'],
    esrb_rating: 'M',
    players: 'Кооператив',
    file_size: '150 GB',
    avg_rating: 9.6,
    critics_rating: 9.6,
    audience_rating: 9.7,
    hype_index: 98,
    emotional_cloud: { awe: 90, excitement: 90, surprise: 95, joy: 80 },
    perception_map: { gameplay: 10, graphics: 9, story: 10, soundtrack: 9, replayability: 10 }
  }
];

async function run() {
  const ds = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'warehouse',
    entities: [Content],
    synchronize: false,
  });

  await ds.initialize();
  const repo = ds.getRepository(Content);

  console.log('Seeding content...');

  for (const item of sampleContent) {
    // Check if exists
    const exists = await repo.findOne({ where: { title: item.title } });
    if (!exists) {
      const content = repo.create(item as any);
      await repo.save(content);
      console.log(`Created: ${item.title}`);
    } else {
      // Update existing
      await repo.update(exists.id, item as any);
      console.log(`Updated: ${item.title}`);
    }
  }

  console.log('Done!');
  await ds.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
