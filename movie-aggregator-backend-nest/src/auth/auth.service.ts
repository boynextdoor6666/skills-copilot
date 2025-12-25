import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async validateUser(usernameOrEmail: string, pass: string): Promise<User> {
    try {
      const user = await this.users.findOne({
        where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      });
      
      if (!user) {
        console.warn(`Auth failed: User not found for ${usernameOrEmail}`);
        throw new UnauthorizedException('User not found');
      }

      if (!user.password) {
        console.error(`Auth failed: User ${user.username} has no password hash`);
        throw new UnauthorizedException('Invalid user state');
      }

      const ok = await bcrypt.compare(pass, user.password);
      if (!ok) {
        console.warn(`Auth failed: Invalid password for ${usernameOrEmail}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      console.error('Error in validateUser:', error);
      throw new Error('Authentication system error');
    }
  }

  async login(user: User) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      token: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        level: user.level,
        totalReviews: user.totalReviews,
        totalRatings: user.totalRatings,
        reputation: user.reputation,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        country: user.country,
      },
    };
  }

  async findById(id: number) {
    return this.users.findOne({ where: { id } });
  }

  async register(data: Partial<User>) {
    const exists = await this.users.findOne({
      where: [{ username: data.username }, { email: data.email }],
    });
    if (exists) throw new UnauthorizedException('User already exists');

    const hashed = await bcrypt.hash(data.password!, 10);
    const user = this.users.create({ ...data, password: hashed });
    await this.users.save(user);
    return this.login(user);
  }
}
