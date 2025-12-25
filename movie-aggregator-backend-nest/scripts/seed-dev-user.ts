import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/users/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

dotenv.config();

async function run() {
  const ds = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'warehouse',
    entities: [User],
    synchronize: false,
  });

  await ds.initialize();

  const users = ds.getRepository(User);
  const username = process.env.SEED_USERNAME || 'devuser';
  const email = process.env.SEED_EMAIL || 'devuser@test.local';
  const password = process.env.SEED_PASSWORD || 'test123';

  let user = await users.findOne({ where: [{ username }, { email }] });
  if (!user) {
    const hash = await bcrypt.hash(password, 10);
    user = users.create({
      username,
      email,
      password: hash,
      role: UserRole.USER,
      isActive: true,
      isVerified: true,
    } as Partial<User>);
    await users.save(user);
  }

  const jwt = new JwtService({
    secret: process.env.JWT_SECRET || 'dev_secret',
    signOptions: { expiresIn: process.env.JWT_EXPIRES || '7d' },
  });

  const token = await jwt.signAsync({ sub: user.id, username: user.username, role: user.role });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    message: 'Seeded dev user. Use these credentials to login in the frontend or set token in localStorage.',
    credentials: { username, email, password },
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  }, null, 2));

  await ds.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
