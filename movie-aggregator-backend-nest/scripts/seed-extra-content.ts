import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Content } from '../src/content/entities/content.entity';
import { ComingSoonItem, ContentType } from '../src/content/entities/coming-soon.entity';
import { HeroCarousel } from '../src/content/entities/hero-carousel.entity';

dotenv.config();

const comingSoonData = [
  {
    title: 'Grand Theft Auto VI',
    content_type: ContentType.GAME,
    release_date: '2025-10-15',
    description: 'Grand Theft Auto VI отправляется в штат Леонида, где находятся залитые неоном улицы Вайс-Сити и не только, в самой масштабной и захватывающей эволюции серии Grand Theft Auto.',
    poster_url: 'https://image.tmdb.org/t/p/w500/2g9ZBjUfF1X53EinykVqiBiePAw.jpg', // Placeholder/Fan art usually
    trailer_url: 'https://www.youtube.com/watch?v=QdBZY2fkU-0',
    expected_score: 98,
    genre: 'Экшен, Приключения',
    developer: 'Rockstar Games',
    publisher: 'Rockstar Games',
    platforms: ['PlayStation 5', 'Xbox Series X'],
    screenshots: [
      'https://image.tmdb.org/t/p/original/k1KrBqq9q1c1.jpg',
      'https://image.tmdb.org/t/p/original/k2KrBqq9q1c2.jpg'
    ],
    is_active: true
  },
  {
    title: 'Аватар: Огонь и пепел',
    content_type: ContentType.MOVIE,
    release_date: '2025-12-19',
    description: 'Третья часть франшизы «Аватар». Джейк Салли и Нейтири создали семью и делают все возможное, чтобы остаться вместе.',
    poster_url: 'https://image.tmdb.org/t/p/w500/8Y43POKjjKDGI9BGoe9swH9jJc.jpg', // Placeholder
    trailer_url: '',
    expected_score: 90,
    genre: 'Фантастика, Боевик',
    director: 'Джеймс Кэмерон',
    studio: '20th Century Studios',
    is_active: true
  },
  {
    title: 'Очень странные дела 5 сезон',
    content_type: ContentType.TV_SERIES,
    release_date: '2025-05-01', // Speculative
    description: 'Финальный сезон «Очень странных дел». Банда Хоукинса должна объединиться, чтобы победить Векну раз и навсегда.',
    poster_url: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    trailer_url: '',
    expected_score: 95,
    genre: 'Фантастика, Ужасы',
    creator: 'Братья Даффер',
    network: 'Netflix',
    is_active: true
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
    entities: [Content, ComingSoonItem, HeroCarousel],
    synchronize: false,
  });

  await ds.initialize();
  const contentRepo = ds.getRepository(Content);
  const comingSoonRepo = ds.getRepository(ComingSoonItem);
  const heroRepo = ds.getRepository(HeroCarousel);

  console.log('Seeding Coming Soon items...');
  for (const item of comingSoonData) {
    const exists = await comingSoonRepo.findOne({ where: { title: item.title } });
    if (!exists) {
      const newItem = comingSoonRepo.create({
        ...item,
        release_date: new Date(item.release_date)
      } as any);
      await comingSoonRepo.save(newItem);
      console.log(`Created Coming Soon: ${item.title}`);
    } else {
      await comingSoonRepo.update(exists.id, {
        ...item,
        release_date: new Date(item.release_date)
      } as any);
      console.log(`Updated Coming Soon: ${item.title}`);
    }
  }

  console.log('Seeding Hero Carousel items...');
  
  // 1. Dune: Part Two (Дюна: Часть вторая)
  const dune = await contentRepo.findOne({ where: { title: 'Дюна: Часть вторая' } });
  if (dune) {
    const exists = await heroRepo.findOne({ where: { title: 'Дюна: Часть вторая' } });
    const heroData = {
      content_id: dune.id,
      title: 'Дюна: Часть вторая',
      subtitle: 'Да здравствуют бойцы',
      description: 'Пол Атрейдес объединяется с Чани и фрименами, чтобы отомстить заговорщикам, уничтожившим его семью.',
      background_image: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
      call_to_action_text: 'Читать обзор',
      call_to_action_link: `/movie/${dune.id}`,
      display_order: 1,
      is_active: true
    };

    if (!exists) {
      await heroRepo.save(heroRepo.create(heroData));
      console.log('Created Hero: Dune: Part Two');
    } else {
      await heroRepo.update(exists.id, heroData);
      console.log('Updated Hero: Dune: Part Two');
    }
  }

  // 2. Cyberpunk 2077
  const cp2077 = await contentRepo.findOne({ where: { title: 'Cyberpunk 2077' } });
  if (cp2077) {
    const exists = await heroRepo.findOne({ where: { title: 'Cyberpunk 2077: Phantom Liberty' } });
    const heroData = {
      content_id: cp2077.id,
      title: 'Cyberpunk 2077: Phantom Liberty',
      subtitle: 'Возвращение в Найт-Сити',
      description: 'Отправляйтесь на опасную миссию шпионажа и интриг, чтобы спасти президента НСША.',
      background_image: 'https://image.tmdb.org/t/p/original/5y7Xg280q18W9qX8r9X9.jpg', // Placeholder
      call_to_action_text: 'Смотреть игру',
      call_to_action_link: `/game/${cp2077.id}`,
      display_order: 2,
      is_active: true
    };

    if (!exists) {
      await heroRepo.save(heroRepo.create(heroData));
      console.log('Created Hero: Cyberpunk 2077');
    } else {
      await heroRepo.update(exists.id, heroData);
      console.log('Updated Hero: Cyberpunk 2077');
    }
  }

  // 3. The Last of Us (Одни из нас)
  const tlou = await contentRepo.findOne({ where: { title: 'Одни из нас' } });
  if (tlou) {
    const exists = await heroRepo.findOne({ where: { title: 'Одни из нас' } });
    const heroData = {
      content_id: tlou.id,
      title: 'Одни из нас',
      subtitle: 'Выстоять и выжить',
      description: 'Переживите эмоциональную историю и незабываемых персонажей в «Одни из нас».',
      background_image: 'https://image.tmdb.org/t/p/original/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
      call_to_action_text: 'Смотреть сериал',
      call_to_action_link: `/series/${tlou.id}`,
      display_order: 3,
      is_active: true
    };

    if (!exists) {
      await heroRepo.save(heroRepo.create(heroData));
      console.log('Created Hero: The Last of Us');
    } else {
      await heroRepo.update(exists.id, heroData);
      console.log('Updated Hero: The Last of Us');
    }
  }

  console.log('Done!');
  await ds.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
