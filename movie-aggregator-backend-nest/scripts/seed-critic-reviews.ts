import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Review } from '../src/reviews/entities/review.entity';
import { User, UserRole } from '../src/users/user.entity';
import { Content } from '../src/content/entities/content.entity';
import { Publication } from '../src/critics/entities/publication.entity';

dotenv.config();

async function run() {
  const ds = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'warehouse',
    entities: [Review, User, Content, Publication],
    synchronize: false,
  });

  await ds.initialize();
  const reviewRepo = ds.getRepository(Review);
  const userRepo = ds.getRepository(User);
  const contentRepo = ds.getRepository(Content);

  console.log('Seeding critic reviews...');

  // Get critics
  const critics = await userRepo.find({ where: { role: UserRole.CRITIC } });
  if (critics.length === 0) {
    console.log('No critics found. Run seed-publications.ts first.');
    return;
  }

  // Get content
  const contents = await contentRepo.find();
  if (contents.length === 0) {
    console.log('No content found.');
    return;
  }

  const reviewsData = [
    {
      contentTitle: 'Начало',
      reviews: [
        { critic: 'ign_critic', rating: 9.0, text: 'Masterpiece of mind-bending action.' },
        { critic: 'gamespot_critic', rating: 8.5, text: 'Incredible visuals and story.' },
        { critic: 'polygon_critic', rating: 9.5, text: 'Nolan at his best.' }
      ]
    },
    {
      contentTitle: 'Дюна: Часть вторая',
      reviews: [
        { critic: 'ign_critic', rating: 10.0, text: 'A sci-fi epic for the ages.' },
        { critic: 'pcgamer_critic', rating: 9.2, text: 'Visually stunning and emotionally resonant.' },
        { critic: 'eurogamer_critic', rating: 8.0, text: 'A bit long, but worth every minute.' }
      ]
    },
    {
      contentTitle: 'Ведьмак 3: Дикая Охота',
      reviews: [
        { critic: 'ign_critic', rating: 9.3, text: 'One of the best RPGs ever made.' },
        { critic: 'pcgamer_critic', rating: 9.8, text: 'A world you can get lost in for hundreds of hours.' },
        { critic: 'kotaku_critic', rating: 9.5, text: 'Simply amazing.' }
      ]
    }
  ];

  for (const item of reviewsData) {
    const content = contents.find(c => c.title === item.contentTitle);
    if (!content) continue;

    for (const r of item.reviews) {
      const critic = critics.find(u => u.username === r.critic);
      if (!critic) continue;

      // Check if review exists
      const exists = await reviewRepo.findOne({ where: { content_id: content.id, user_id: critic.id } });
      if (!exists) {
        const review = reviewRepo.create({
          content_id: content.id,
          movie_id: content.id,
          user_id: critic.id,
          content: r.text,
          rating: r.rating,
          aspects: { story: 9, visuals: 9, sound: 9 }, // Dummy aspects
          emotions: { joy: 50, awe: 50 } // Dummy emotions
        });
        await reviewRepo.save(review);
        console.log(`Added review for ${content.title} by ${critic.username}`);
      } else {
        console.log(`Review exists for ${content.title} by ${critic.username}`);
      }
    }
  }

  console.log('Done!');
  await ds.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
