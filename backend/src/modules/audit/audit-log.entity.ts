import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum AuditAction {
  CREATE       = 'CREATE',
  UPDATE       = 'UPDATE',
  DELETE       = 'DELETE',
  LOGIN        = 'LOGIN',
  LOGOUT       = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  EXPORT       = 'EXPORT',
  ACCESS       = 'ACCESS',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ length: 100 })
  resource: string;

  @Column({ type: 'int', nullable: true })
  resourceId: number;

  @Column({ length: 10 })
  method: string;

  @Column({ length: 500 })
  endpoint: string;

  @Column({ length: 50, nullable: true })
  ip: string;

  @Column({ length: 200, nullable: true })
  userAgent: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;
}
