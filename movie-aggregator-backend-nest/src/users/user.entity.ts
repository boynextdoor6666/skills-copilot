import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Publication } from '../critics/entities/publication.entity';

export enum UserRole { USER = 'USER', CRITIC = 'CRITIC', ADMIN = 'ADMIN' }
export enum UserLevel { NOVICE = 'NOVICE', ENTHUSIAST = 'ENTHUSIAST', EXPERT = 'EXPERT', LEGEND = 'LEGEND' }

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserLevel, default: UserLevel.NOVICE })
  level: UserLevel;

  @Column({ name: 'registration_date', type: 'datetime', nullable: true })
  registrationDate: Date;

  @Column({ name: 'last_login', type: 'datetime', nullable: true })
  lastLogin: Date;

  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'total_reviews', default: 0 })
  totalReviews: number;

  @Column({ name: 'total_ratings', default: 0 })
  totalRatings: number;

  @Column({ default: 0 })
  reputation: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ length: 100, nullable: true })
  country: string;

  @ManyToOne(() => Publication, { nullable: true })
  @JoinColumn({ name: 'publication_id' })
  publication: Publication;

  @Column({ name: 'publication_id', nullable: true })
  publicationId: number;
}
