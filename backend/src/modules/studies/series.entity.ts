import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('series')
export class Series {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studyId: number;

  @Column({ unique: true })
  seriesInstanceUID: string;

  @Column({ nullable: true })
  seriesNumber: number;

  @Column({ nullable: true })
  seriesDescription: string;

  @Column({ nullable: true })
  modality: string;

  @Column({ nullable: true })
  bodyPart: string;

  @Column({ default: 0 })
  numberOfImages: number;

  @Column({ nullable: true })
  seriesDate: string;

  @Column({ nullable: true })
  seriesTime: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
