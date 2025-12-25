import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Content } from './content.entity';

@Entity('hero_carousel')
export class HeroCarousel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  content_id: number;

  @ManyToOne(() => Content, { nullable: true })
  @JoinColumn({ name: 'content_id' })
  content: Content;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 500, nullable: true })
  subtitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  background_image: string;

  @Column({ length: 100, nullable: true })
  call_to_action_text: string;

  @Column({ length: 500, nullable: true })
  call_to_action_link: string;

  @Column({ default: 0 })
  display_order: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
