import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ResultFlag {
  NORMAL = 'normal',
  LOW = 'low',
  HIGH = 'high',
  CRITICAL_LOW = 'critical_low',
  CRITICAL_HIGH = 'critical_high'
}

@Entity('lab_results')
export class LabResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column()
  parameterName: string;

  @Column()
  value: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  referenceRange: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  numericValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  minRange: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  maxRange: number;

  @Column({ type: 'enum', enum: ResultFlag, default: ResultFlag.NORMAL })
  flag: ResultFlag;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
