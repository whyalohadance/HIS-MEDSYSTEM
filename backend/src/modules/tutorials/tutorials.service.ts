import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TutorialProgress } from './tutorial-progress.entity';

const TUTORIALS = [
  {
    id: 'admin-overview',
    title: 'Администратор — обзор системы',
    titleRo: 'Administrator — prezentare generală',
    titleEn: 'Administrator — system overview',
    description: 'Полный обзор возможностей администратора',
    icon: 'admin_panel_settings',
    color: '#1a73e8',
    role: 'admin',
    duration: 5,
    difficulty: 'easy',
    sections: ['Создание персонала', 'Управление кабинетами', 'Каталог тестов', 'Отчёты'],
  },
  {
    id: 'doctor-workflow',
    title: 'Врач — приёмы и диагнозы',
    titleRo: 'Medic — programări și diagnostice',
    titleEn: 'Doctor — appointments and diagnoses',
    description: 'Как принимать пациентов и работать с записями',
    icon: 'medical_services',
    color: '#10b981',
    role: 'doctor',
    duration: 7,
    difficulty: 'medium',
    sections: ['Просмотр приёмов', 'Работа с карточкой пациента', 'Назначение лечения', 'Заказ анализов'],
  },
  {
    id: 'reception-booking',
    title: 'Ресепшн — запись на приём',
    titleRo: 'Recepție — programare',
    titleEn: 'Reception — booking',
    description: 'Регистрация пациентов и создание приёмов',
    icon: 'support_agent',
    color: '#f59e0b',
    role: 'receptionist',
    duration: 8,
    difficulty: 'medium',
    sections: ['Регистрация пациента', 'Создание приёма', 'Выбор кабинета', 'Проверка свободности доктора'],
  },
  {
    id: 'radiologist-dicom',
    title: 'Радиолог — DICOM Viewer',
    titleRo: 'Radiolog — DICOM Viewer',
    titleEn: 'Radiologist — DICOM Viewer',
    description: 'Работа с радиологическими исследованиями',
    icon: 'medical_information',
    color: '#7c3aed',
    role: 'radiologist',
    duration: 10,
    difficulty: 'hard',
    sections: ['Worklist', 'Открытие DICOM', 'Инструменты viewer', 'Заполнение заключения', 'Шаблоны'],
  },
  {
    id: 'lab-results',
    title: 'Лаборант — ввод результатов',
    titleRo: 'Laborant — introducere rezultate',
    titleEn: 'Lab Technician — entering results',
    description: 'Обработка анализов и ввод результатов',
    icon: 'biotech',
    color: '#06b6d4',
    role: 'lab_technician',
    duration: 7,
    difficulty: 'medium',
    sections: ['Worklist заказов', 'Приоритеты', 'Ввод значений', 'Auto-flag система', 'PDF результаты'],
  },
  {
    id: 'system-overview',
    title: 'О системе — общий обзор',
    titleRo: 'Despre sistem — prezentare generală',
    titleEn: 'About system — overview',
    description: 'Архитектура HIS+RIS+LIS, технологии',
    icon: 'info',
    color: '#94a3b8',
    role: 'all',
    duration: 5,
    difficulty: 'easy',
    sections: ['Модули', 'Технологии', 'Архитектура', 'Безопасность'],
  },
  {
    id: 'languages',
    title: 'Языки и переводы',
    titleRo: 'Limbi și traduceri',
    titleEn: 'Languages and translations',
    description: 'Как работать с RU/RO/EN',
    icon: 'language',
    color: '#ec4899',
    role: 'all',
    duration: 3,
    difficulty: 'easy',
    sections: ['Переключение языка', 'Что переводится', 'Личные настройки'],
  },
  {
    id: 'security-basics',
    title: 'Безопасность данных',
    titleRo: 'Securitatea datelor',
    titleEn: 'Data security',
    description: 'Защита медицинских данных пациентов',
    icon: 'shield',
    color: '#ef4444',
    role: 'all',
    duration: 5,
    difficulty: 'medium',
    sections: ['Пароли', 'Роли доступа', 'JWT токены', 'Что не делать'],
  },
];

@Injectable()
export class TutorialsService {
  constructor(
    @InjectRepository(TutorialProgress)
    private repo: Repository<TutorialProgress>,
  ) {}

  getTutorials(userRole?: string) {
    if (!userRole || userRole === 'admin') return TUTORIALS;
    return TUTORIALS.filter(t => t.role === userRole || t.role === 'all');
  }

  async getUserProgress(userId: number) {
    return this.repo.find({ where: { userId } });
  }

  async markComplete(userId: number, tutorialId: string, rating?: number) {
    let entry = await this.repo.findOne({ where: { userId, tutorialId } });
    if (!entry) {
      entry = this.repo.create({
        userId,
        tutorialId,
        completed: true,
        completedAt: new Date(),
        rating,
      });
    } else {
      entry.completed = true;
      entry.completedAt = new Date();
      if (rating !== undefined) entry.rating = rating;
    }
    return this.repo.save(entry);
  }
}
