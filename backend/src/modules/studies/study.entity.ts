import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum StudyType {
  MRI = 'mri',
  CT = 'ct',
  XRAY = 'xray',
  ULTRASOUND = 'ultrasound',
  PET = 'pet',
  MAMMOGRAPHY = 'mammography'
}

export enum StudyStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum StudyPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  STAT = 'stat'
}

@Entity('studies')
export class Study {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  studyId: string;

  @Column()
  patientId: number;

  @Column({ nullable: true })
  appointmentId: number;

  @Column({ nullable: true })
  radiologistId: number;

  @Column({ nullable: true })
  referringDoctorId: number;

  @Column({ type: 'enum', enum: StudyType })
  type: StudyType;

  @Column({ type: 'enum', enum: StudyStatus, default: StudyStatus.PENDING })
  status: StudyStatus;

  @Column({ type: 'enum', enum: StudyPriority, default: StudyPriority.ROUTINE })
  priority: StudyPriority;

  @Column({ nullable: true })
  bodyPart: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  clinicalInfo: string;

  @Column({ type: 'text', nullable: true })
  findings: string;

  @Column({ type: 'text', nullable: true })
  conclusion: string;

  @Column({ nullable: true })
  modalityId: number;

  @Column({ nullable: true })
  roomId: number;

  @Column({ nullable: true })
  scheduledAt: string;

  @Column({ nullable: true })
  scheduledTime: string;

  @Column({ nullable: true })
  completedAt: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ nullable: true })
  fileUrl: string;

  // DICOM study-level identifiers
  @Column({ nullable: true })
  studyInstanceUID: string;

  @Column({ nullable: true })
  studyDate: string;

  @Column({ nullable: true })
  studyTime: string;

  @Column({ nullable: true })
  accessionNumber: string;

  @Column({ nullable: true })
  referringPhysician: string;

  @Column({ default: 0 })
  numberOfSeries: number;

  @Column({ default: 0 })
  numberOfImages: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
