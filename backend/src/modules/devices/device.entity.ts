import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Room } from '../rooms/room.entity';

// ============================================================================
// Enums pentru Device
// ============================================================================

export enum DeviceType {
  MRI = 'mri',
  CT = 'ct',
  XRAY = 'xray',
  ULTRASOUND = 'ultrasound',
  MAMMOGRAPHY = 'mammography',
  PET = 'pet',
  LAB_ANALYZER = 'lab_analyzer',
  ECG = 'ecg',
  ENDOSCOPE = 'endoscope',
  OTHER = 'other',
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  UNKNOWN = 'unknown',
}

// ============================================================================
// Device Entity
// ============================================================================

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  // --- Informații de bază ---

  @Column()
  name: string; // "Siemens MRI Skyra" sau "Roche cobas 6000"

  @Column({ type: 'enum', enum: DeviceType })
  type: DeviceType;

  @Column()
  manufacturer: string; // "Siemens", "GE Healthcare", "Philips", "Roche"

  @Column()
  model: string; // "Skyra 3T", "Revolution CT", "Vivid E95"

  @Column({ unique: true })
  serialNumber: string; // Număr de serie unic al aparatului

  // --- Setări de rețea (pentru DICOM/HL7 în viitor) ---

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'int', nullable: true })
  port: number | null;

  @Column({ type: 'varchar', nullable: true })
  aeTitle: string | null; // DICOM Application Entity Title

  // --- Status și sănătate ---

  @Column({
    type: 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.UNKNOWN,
  })
  status: DeviceStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastPingAt: Date | null;

  @Column({ type: 'int', nullable: true })
  lastPingMs: number | null; // timp de răspuns în milisecunde

  // --- Asociere cabinet ---

  @Column({ type: 'int', nullable: true })
  roomId: number | null;

  @ManyToOne(() => Room, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'roomId' })
  room: Room | null;

  // --- Mentenanță ---

  @Column({ type: 'date', nullable: true })
  lastMaintenanceDate: Date | null;

  @Column({ type: 'date', nullable: true })
  nextMaintenanceDate: Date | null;

  @Column({ type: 'text', nullable: true })
  maintenanceNotes: string | null;

  // --- Informații suplimentare ---

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ default: true })
  isActive: boolean;

  // --- Metadate ---

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
