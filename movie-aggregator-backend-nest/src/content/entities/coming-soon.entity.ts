import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ContentType {
  MOVIE = 'MOVIE',
  TV_SERIES = 'TV_SERIES',
  GAME = 'GAME',
}

@Entity('coming_soon_items')
export class ComingSoonItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: ContentType,
  })
  content_type: ContentType;

  @Column({ type: 'date' })
  release_date: Date;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  poster_url: string;

  @Column({ length: 500, nullable: true })
  trailer_url: string;

  @Column({ nullable: true })
  expected_score: number;

  @Column({ length: 100, nullable: true })
  genre: string;

  @Column({ length: 255, nullable: true })
  developer: string;

  @Column({ length: 255, nullable: true })
  director: string;

  @Column({ length: 255, nullable: true })
  creator: string;

  @Column({ length: 255, nullable: true })
  studio: string;

  @Column({ length: 255, nullable: true })
  network: string;

  @Column({ length: 255, nullable: true })
  publisher: string;

  @Column({ type: 'json', nullable: true })
  platforms: string[];

  @Column({ default: 0 })
  watchlist_count: number;

  @Column({ type: 'json', nullable: true })
  screenshots: string[];

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
