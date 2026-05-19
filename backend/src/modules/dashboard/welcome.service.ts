import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class WelcomeService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource
  ) {}

  async getSetupProgress() {
    const usersCount = await this.userRepo.count();
    const adminCount = await this.userRepo.count({ where: { role: 'admin' as any } });
    const doctorCount = await this.userRepo.count({ where: { role: 'doctor' as any } });

    let roomsCount = 0;
    let testsCount = 0;
    let patientsCount = 0;
    let appointmentsCount = 0;

    try {
      const roomsResult = await this.dataSource.query('SELECT COUNT(*) FROM rooms');
      roomsCount = parseInt(roomsResult[0]?.count || '0');
    } catch {}

    try {
      const testsResult = await this.dataSource.query('SELECT COUNT(*) FROM lab_tests');
      testsCount = parseInt(testsResult[0]?.count || '0');
    } catch {}

    try {
      const patientsResult = await this.dataSource.query('SELECT COUNT(*) FROM patients');
      patientsCount = parseInt(patientsResult[0]?.count || '0');
    } catch {}

    try {
      const aptResult = await this.dataSource.query('SELECT COUNT(*) FROM appointments');
      appointmentsCount = parseInt(aptResult[0]?.count || '0');
    } catch {}

    const clinicConfigured = await this.isClinicConfigured();

    const checklist = [
      {
        id: 'admin',
        title: 'Создать админ-аккаунт',
        description: 'Главный аккаунт для управления системой',
        icon: 'admin_panel_settings',
        completed: adminCount > 0,
        current: adminCount,
        target: 1,
        route: '/profile'
      },
      {
        id: 'clinic',
        title: 'Настроить клинику',
        description: 'Название, город, валюта',
        icon: 'business',
        completed: clinicConfigured,
        current: clinicConfigured ? 1 : 0,
        target: 1,
        route: '/profile'
      },
      {
        id: 'staff',
        title: 'Добавить персонал',
        description: 'Минимум 1 доктор, 1 ресепшн',
        icon: 'groups',
        completed: usersCount >= 5,
        current: Math.min(usersCount, 5),
        target: 5,
        route: '/staff'
      },
      {
        id: 'rooms',
        title: 'Создать кабинеты',
        description: 'Консультация, радиология, лаборатория',
        icon: 'meeting_room',
        completed: roomsCount >= 3,
        current: Math.min(roomsCount, 3),
        target: 3,
        route: '/rooms'
      },
      {
        id: 'tests',
        title: 'Каталог анализов',
        description: 'Базовый набор лабораторных тестов',
        icon: 'biotech',
        completed: testsCount >= 5,
        current: Math.min(testsCount, 5),
        target: 5,
        route: '/lab/catalog'
      },
      {
        id: 'patients',
        title: 'Первый пациент',
        description: 'Зарегистрируйте первого пациента',
        icon: 'person_add',
        completed: patientsCount > 0,
        current: Math.min(patientsCount, 1),
        target: 1,
        route: '/patients'
      },
      {
        id: 'appointment',
        title: 'Первый приём',
        description: 'Запишите пациента на приём',
        icon: 'event',
        completed: appointmentsCount > 0,
        current: Math.min(appointmentsCount, 1),
        target: 1,
        route: '/appointments'
      }
    ];

    const completedCount = checklist.filter(c => c.completed).length;
    const totalCount = checklist.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    const achievements = [
      {
        id: 'first_admin',
        title: 'First Admin',
        description: 'Создан админ-аккаунт',
        icon: 'admin_panel_settings',
        unlocked: adminCount > 0,
        color: '#1a73e8'
      },
      {
        id: 'clinic_setup',
        title: 'Clinic Setup',
        description: 'Клиника настроена',
        icon: 'business',
        unlocked: clinicConfigured,
        color: '#10b981'
      },
      {
        id: 'team_builder',
        title: 'Team Builder',
        description: 'Добавлено 5+ сотрудников',
        icon: 'groups',
        unlocked: usersCount >= 5,
        color: '#f59e0b'
      },
      {
        id: 'room_master',
        title: 'Room Master',
        description: 'Создано 3+ кабинета',
        icon: 'meeting_room',
        unlocked: roomsCount >= 3,
        color: '#7c3aed'
      },
      {
        id: 'lab_ready',
        title: 'Lab Ready',
        description: '5+ анализов в каталоге',
        icon: 'biotech',
        unlocked: testsCount >= 5,
        color: '#06b6d4'
      },
      {
        id: 'first_patient',
        title: 'First Patient',
        description: 'Первый пациент зарегистрирован',
        icon: 'person_add',
        unlocked: patientsCount > 0,
        color: '#ec4899'
      },
      {
        id: 'first_visit',
        title: 'First Visit',
        description: 'Первый приём создан',
        icon: 'event',
        unlocked: appointmentsCount > 0,
        color: '#ef4444'
      },
      {
        id: 'production_ready',
        title: 'Production Ready',
        description: 'Все шаги настройки выполнены',
        icon: 'verified',
        unlocked: completedCount === totalCount,
        color: '#D5001C',
        legendary: true
      }
    ];

    return {
      progress: {
        completed: completedCount,
        total: totalCount,
        percent: progressPercent,
        isComplete: completedCount === totalCount
      },
      checklist,
      achievements,
      stats: {
        usersCount,
        doctorCount,
        roomsCount,
        testsCount,
        patientsCount,
        appointmentsCount
      }
    };
  }

  async getClinicSettings() {
    try {
      const settings = await this.dataSource.query('SELECT key, value FROM clinic_settings');
      const result: any = {};
      for (const s of settings) {
        result[s.key] = s.value;
      }
      return result;
    } catch {
      return {};
    }
  }

  private async isClinicConfigured(): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `SELECT value FROM clinic_settings WHERE key = 'clinic_name'`
      );
      return result.length > 0 && !!result[0]?.value;
    } catch {
      return false;
    }
  }
}
