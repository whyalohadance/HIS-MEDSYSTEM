import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('dicom_images')
export class DicomImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  seriesId: number;

  @Column()
  studyId: number;

  @Column({ unique: true })
  sopInstanceUID: string;

  @Column({ nullable: true })
  instanceNumber: number;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  rows: number;

  @Column({ nullable: true })
  columns: number;

  @Column({ nullable: true })
  bitsAllocated: number;

  @Column({ nullable: true })
  windowCenter: string;

  @Column({ nullable: true })
  windowWidth: string;

  @Column({ type: 'float', nullable: true })
  sliceLocation: number;

  @Column({ type: 'float', nullable: true })
  sliceThickness: number;

  @Column({ nullable: true })
  imagePosition: string;

  @Column({ nullable: true })
  imageOrientation: string;

  @Column({ nullable: true })
  pixelSpacing: string;

  @CreateDateColumn()
  createdAt: Date;
}
