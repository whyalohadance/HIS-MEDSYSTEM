import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tutorial_progress')
export class TutorialProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  tutorialId: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  completedAt: Date;

  @Column({ nullable: true })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
