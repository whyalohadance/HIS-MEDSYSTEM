import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum RoomType {
  CONSULTATION = 'consultation',
  RADIOLOGY    = 'radiology',
  LABORATORY   = 'laboratory',
  PROCEDURE    = 'procedure',
  SURGERY      = 'surgery',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  number: string;

  @Column({ type: 'enum', enum: RoomType, default: RoomType.CONSULTATION })
  type: RoomType;

  @Column({ nullable: true })
  floor: number;

  @Column({ nullable: true })
  assignedUserId: number;

  @Column({ type: 'json', nullable: true })
  services: { name: string; price: number; duration: number }[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
