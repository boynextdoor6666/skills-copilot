import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Publication } from '../src/critics/entities/publication.entity';
import { User, UserRole } from '../src/users/user.entity';
import * as bcrypt from 'bcrypt';

dotenv.config();

const publications = [
  { name: 'IGN', website: 'https://www.ign.com', logo_url: 'https://assets1.ignimgs.com/2015/05/27/ign-logo-jpg-e9e045.jpg' },
  { name: 'GameSpot', website: 'https://www.gamespot.com', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/GameSpot_logo.jpg' },
  { name: 'Polygon', website: 'https://www.polygon.com', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Polygon_logo.svg/2560px-Polygon_logo.svg.png' },
  { name: 'Kotaku', website: 'https://kotaku.com', logo_url: 'https://i.kinja-img.com/gawker-media/image/upload/c_fill,f_auto,fl_progressive,g_center,h_200,q_80,w_200/ku17.png' },
  { name: 'PC Gamer', website: 'https://www.pcgamer.com', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/PC_Gamer_logo.svg/1200px-PC_Gamer_logo.svg.png' },
  { name: 'Eurogamer', website: 'https://www.eurogamer.net', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Eurogamer_logo.svg/2560px-Eurogamer_logo.svg.png' }
];

async function run() {
  const ds = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'warehouse',
    entities: [Publication, User],
    synchronize: false,
  });

  await ds.initialize();
  const pubRepo = ds.getRepository(Publication);
  const userRepo = ds.getRepository(User);

  console.log('Seeding publications...');

  for (const p of publications) {
    let pub = await pubRepo.findOne({ where: { name: p.name } });
    if (!pub) {
      pub = pubRepo.create(p);
      await pubRepo.save(pub);
      console.log(`Created publication: ${p.name}`);
    } else {
      console.log(`Publication exists: ${p.name}`);
    }

    // Create a critic user for this publication
    const criticUsername = `${p.name.toLowerCase().replace(/\s+/g, '')}_critic`;
    let critic = await userRepo.findOne({ where: { username: criticUsername } });
    
    if (!critic) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      critic = userRepo.create({
        username: criticUsername,
        email: `${criticUsername}@example.com`,
        password: hashedPassword,
        role: UserRole.CRITIC,
        publication: pub,
        isVerified: true,
        avatarUrl: p.logo_url
      });
      await userRepo.save(critic);
      console.log(`Created critic: ${criticUsername}`);
    } else {
        // Update publication link if missing
        // We need to load the relation to check
        const criticWithPub = await userRepo.findOne({ where: { id: critic.id }, relations: ['publication'] });
        if (criticWithPub && !criticWithPub.publication) {
            critic.publication = pub;
            await userRepo.save(critic);
            console.log(`Linked critic ${criticUsername} to ${p.name}`);
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
