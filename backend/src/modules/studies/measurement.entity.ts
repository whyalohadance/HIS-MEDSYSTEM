import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MeasurementType {
  LENGTH = 'length',
  ANGLE = 'angle',
  ELLIPSE = 'ellipse',
  ANNOTATION = 'annotation'
}

@Entity('measurements')
export class Measurement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studyId: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ type: 'enum', enum: MeasurementType, default: MeasurementType.LENGTH })
  type: MeasurementType;

  @Column({ type: 'float' })
  x1: number;

  @Column({ type: 'float' })
  y1: number;

  @Column({ type: 'float' })
  x2: number;

  @Column({ type: 'float' })
  y2: number;

  @Column()
  distance: string;

  @Column({ nullable: true })
  sliceIndex: number;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
