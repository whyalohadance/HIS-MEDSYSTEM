import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Patient } from '../patients/patient.entity';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  doctorId: number;

  @Column({ nullable: true })
  roomId: number;

  @Column()
  date: string;

  @Column()
  time: string;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  price: number;

  @Column({ default: false })
  notified: boolean;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctorId' })
  doctor: User;

  @CreateDateColumn()
  createdAt: Date;
}
