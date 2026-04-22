import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('annotations')
export class Annotation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studyId: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ type: 'float' })
  x: number;

  @Column({ type: 'float' })
  y: number;

  @Column({ type: 'float', nullable: true })
  labelX: number;

  @Column({ type: 'float', nullable: true })
  labelY: number;

  @Column()
  text: string;

  @Column({ default: '#ef4444' })
  color: string;

  @Column({ nullable: true })
  sliceIndex: number;

  @CreateDateColumn()
  createdAt: Date;
}
