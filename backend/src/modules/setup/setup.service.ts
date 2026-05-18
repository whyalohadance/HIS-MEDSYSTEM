import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class SetupService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource
  ) {}

  async checkSetupStatus() {
    const usersCount = await this.userRepo.count();
    const adminCount = await this.userRepo.count({ where: { role: UserRole.ADMIN } });

    return {
      success: true,
      data: {
        isSetupComplete: adminCount > 0,
        hasUsers: usersCount > 0,
        usersCount,
        adminCount
      }
    };
  }

  async initialize(dto: {
    admin: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone?: string;
    };
    clinic: {
      name: string;
      city: string;
      timezone: string;
      defaultLanguage: 'ru' | 'ro' | 'en';
      currency: string;
    };
    importDemo: boolean;
  }) {
    const adminCount = await this.userRepo.count({ where: { role: UserRole.ADMIN } });
    if (adminCount > 0) {
      throw new ConflictException('Setup already completed. Admin already exists.');
    }

    if (!dto.admin?.email || !dto.admin?.password) {
      throw new BadRequestException('Email and password required');
    }
    if (dto.admin.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const hashedPassword = await bcrypt.hash(dto.admin.password, 10);
    const admin = this.userRepo.create({
      firstName: dto.admin.firstName,
      lastName: dto.admin.lastName,
      email: dto.admin.email,
      password: hashedPassword,
      phone: dto.admin.phone || '',
      role: UserRole.ADMIN,
      isActive: true,
      specialization: 'Administrator'
    });
    await this.userRepo.save(admin);

    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS clinic_settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR(100) UNIQUE NOT NULL,
          value TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `);

      const settings = [
        ['clinic_name', dto.clinic.name],
        ['clinic_city', dto.clinic.city],
        ['clinic_timezone', dto.clinic.timezone],
        ['default_language', dto.clinic.defaultLanguage],
        ['currency', dto.clinic.currency]
      ];

      for (const [key, value] of settings) {
        await this.dataSource.query(
          `INSERT INTO clinic_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = $2, "updatedAt" = NOW()`,
          [key, value]
        );
      }
    } catch (e) {
      console.warn('Could not save clinic settings:', e.message);
    }

    return {
      success: true,
      data: {
        message: 'Setup completed successfully',
        adminId: admin.id,
        adminEmail: admin.email,
        demoWillBeImported: dto.importDemo
      }
    };
  }

  async importDemoData() {
    return {
      success: true,
      data: { message: 'Demo data import endpoint ready' }
    };
  }
}
