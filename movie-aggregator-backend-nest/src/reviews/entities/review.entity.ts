import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Content } from '../../content/entities/content.entity';
import { User } from '../../users/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content_id: number;

  @Column({ nullable: true })
  movie_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', nullable: true })
  aspects: Record<string, number>;

  @Column({ type: 'json', nullable: true })
  emotions: Record<string, number>;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Content)
  @JoinColumn({ name: 'content_id' })
  contentEntity: Content;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
