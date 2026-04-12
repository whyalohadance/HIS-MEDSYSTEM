import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ModalityType {
  MRI = 'mri',
  CT = 'ct',
  XRAY = 'xray',
  ULTRASOUND = 'ultrasound',
  PET = 'pet',
  MAMMOGRAPHY = 'mammography'
}

@Entity('modalities')
export class Modality {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ModalityType })
  type: ModalityType;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  roomId: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
