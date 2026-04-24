import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum TestCategory {
  HEMATOLOGY = 'hematology',
  BIOCHEMISTRY = 'biochemistry',
  URINE = 'urine',
  HORMONES = 'hormones',
  IMMUNOLOGY = 'immunology',
  MICROBIOLOGY = 'microbiology',
  COAGULATION = 'coagulation',
  CARDIAC = 'cardiac'
}

@Entity('lab_tests')
export class LabTest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: TestCategory })
  category: TestCategory;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: 1 })
  durationHours: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  parameters: any;

  @CreateDateColumn()
  createdAt: Date;
}
