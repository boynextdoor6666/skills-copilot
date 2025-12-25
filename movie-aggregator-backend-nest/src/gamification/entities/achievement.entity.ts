import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 50, nullable: true })
  icon_name: string; // e.g., 'trophy', 'star', etc.

  @Column({ type: 'int', default: 0 })
  xp_reward: number;

  @Column({ length: 50, default: 'general' })
  category: string;

  @CreateDateColumn()
  created_at: Date;
}
