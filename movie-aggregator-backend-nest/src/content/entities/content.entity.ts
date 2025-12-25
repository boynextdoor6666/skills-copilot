import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum ContentType {
  MOVIE = 'MOVIE',
  TV_SERIES = 'TV_SERIES',
  GAME = 'GAME',
}

@Entity('content')
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: ContentType,
    default: ContentType.MOVIE,
  })
  content_type: ContentType;

  @Column({ nullable: true })
  release_year: number;

  @Column({ length: 100, nullable: true })
  genre: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  avg_rating: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  critics_rating: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  audience_rating: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  hype_index: number;

  @Column({ type: 'int', default: 0 })
  reviews_count: number;

  @Column({ type: 'int', default: 0 })
  positive_reviews: number;

  @Column({ type: 'int', default: 0 })
  mixed_reviews: number;

  @Column({ type: 'int', default: 0 })
  negative_reviews: number;

  @Column({ type: 'json', nullable: true })
  emotional_cloud: Record<string, number>;

  @Column({ type: 'json', nullable: true })
  perception_map: Record<string, number>;

  @Column({ length: 500, nullable: true })
  poster_url: string;

  @Column({ length: 500, nullable: true })
  trailer_url: string;

  // Movie/Series specific fields
  @Column({ length: 255, nullable: true })
  director: string;

  @Column({ type: 'text', nullable: true })
  cast: string; // comma-separated list

  @Column({ length: 500, nullable: true })
  director_photo_url: string;

  @Column({ type: 'json', nullable: true })
  cast_photos: string[] | null; // array of photo URLs aligned with cast order

  @Column({ type: 'int', nullable: true })
  runtime: number; // minutes

  // Game specific fields
  @Column({ length: 255, nullable: true })
  developer: string;

  @Column({ length: 255, nullable: true })
  publisher: string;

  @Column({ type: 'json', nullable: true })
  platforms: string[] | null; // e.g., ["PlayStation 5", "Xbox Series X"]

  @Column({ length: 50, nullable: true })
  esrb_rating: string;

  @Column({ length: 50, nullable: true })
  players: string; // e.g., "1-30 Online"

  @Column({ length: 50, nullable: true })
  file_size: string; // e.g., "150 GB"

  @Column({ type: 'json', nullable: true })
  technical_info: any; // free-form JSON for system requirements, languages, etc.

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
