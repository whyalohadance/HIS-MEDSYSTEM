import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  doctorId: number;

  @Column()
  roomId: number;

  @Column()
  dayOfWeek: number; // 1-7 (Пн-Вс)

  @Column()
  startTime: string; // "09:00"

  @Column()
  endTime: string; // "18:00"

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
