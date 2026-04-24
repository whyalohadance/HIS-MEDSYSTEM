import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum OrderPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  STAT = 'stat'
}

@Entity('lab_orders')
export class LabOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderNumber: string;

  @Column()
  patientId: number;

  @Column({ nullable: true })
  appointmentId: number;

  @Column()
  doctorId: number;

  @Column({ nullable: true })
  labTechnicianId: number;

  @Column()
  testId: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'enum', enum: OrderPriority, default: OrderPriority.ROUTINE })
  priority: OrderPriority;

  @Column({ type: 'text', nullable: true })
  clinicalInfo: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  scheduledAt: string;

  @Column({ nullable: true })
  collectedAt: string;

  @Column({ nullable: true })
  completedAt: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
