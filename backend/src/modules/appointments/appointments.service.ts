import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { StudiesService } from '../studies/studies.service';
import { LabService } from '../lab/lab.service';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,
    private studiesService: StudiesService,
    private labService: LabService,
    private roomsService: RoomsService,
  ) {}

  async findAll(userId: number, userRole: string): Promise<Appointment[]> {
    if (userRole === 'admin' || userRole === 'receptionist') {
      return this.repo.find({ relations: ['patient', 'doctor'], order: { createdAt: 'DESC' } });
    }
    return this.repo.find({
      where: { doctorId: userId },
      relations: ['patient', 'doctor'],
      order: { createdAt: 'DESC' }
    });
  }

  async create(dto: any, userId: number, userRole: string): Promise<Appointment> {
    if (userRole !== 'receptionist' && userRole !== 'admin') {
      throw new ForbiddenException('Только регистратура может создавать приёмы');
    }
    const apt = this.repo.create(dto);
    const saved = await this.repo.save(apt);

    if (dto.roomId) {
      try {
        const room = await this.roomsService.findOne(dto.roomId);

        if (room?.type === 'radiology') {
          await this.studiesService.create({
            patientId: dto.patientId,
            appointmentId: (saved as any).id,
            referringDoctorId: dto.doctorId,
            type: this.guessStudyType(dto.examination) as any,
            bodyPart: dto.examination,
            description: dto.examination,
            clinicalInfo: dto.notes,
            scheduledAt: dto.date,
            priority: 'routine' as any,
          });
        }

        if (room?.type === 'laboratory') {
          const tests = await this.labService.findAllTests();
          const test = tests.find(t => t.name === dto.examination);
          await this.labService.createOrder(dto.doctorId || userId, {
            patientId: dto.patientId,
            appointmentId: (saved as any).id,
            testId: test?.id,
            priority: 'routine',
            clinicalInfo: dto.notes,
            scheduledAt: dto.date,
          });
        }
      } catch (e: any) {
        console.error('Workflow auto-create error:', e?.message);
      }
    }

    return saved as unknown as Appointment;
  }

  async updateStatus(id: number, status: string, userId: number, userRole: string): Promise<Appointment> {
    if (userRole !== 'admin' && userRole !== 'receptionist') {
      throw new ForbiddenException('Только администратор или ресепшн могут изменять статус приёма');
    }
    const apt = await this.repo.findOne({ where: { id } });
    if (!apt) throw new NotFoundException('Приём не найден');

    const updateData: any = { status };
    if (status === 'completed' || status === 'cancelled') {
      updateData.completedAt = new Date().toISOString();
    }
    await this.repo.update(id, updateData);
    return this.repo.findOne({ where: { id } }) as Promise<Appointment>;
  }

  async updateAppointmentData(id: number, data: any): Promise<Appointment> {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } }) as Promise<Appointment>;
  }

  async remove(id: number, userId: number, userRole: string): Promise<void> {
    const apt = await this.repo.findOne({ where: { id } });
    if (!apt) throw new NotFoundException('Приём не найден');
    if (userRole !== 'admin' && userRole !== 'receptionist') throw new ForbiddenException('Нет доступа');
    await this.repo.remove(apt);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async autoUpdateAppointmentStatuses(): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Обрабатываем приёмы на сегодня
    const todayApts = await this.repo.find({
      where: [
        { date: today, status: AppointmentStatus.SCHEDULED },
        { date: today, status: AppointmentStatus.IN_PROGRESS },
      ]
    });

    for (const apt of todayApts) {
      if (!apt.time) continue;
      const startMin = this.timeToMinutes(apt.time);
      const endMin   = startMin + (apt.duration || 30);

      // Scheduled → in_progress (время наступило, но ещё не закончилось)
      if (apt.status === AppointmentStatus.SCHEDULED && currentMinutes >= startMin && currentMinutes < endMin) {
        await this.repo.update(apt.id, { status: AppointmentStatus.IN_PROGRESS });
        console.log(`Auto: appointment #${apt.id} → in_progress`);
        continue;
      }

      // Scheduled → completed напрямую (пропустили in_progress окно)
      if (apt.status === AppointmentStatus.SCHEDULED && currentMinutes >= endMin) {
        await this.repo.update(apt.id, {
          status: AppointmentStatus.COMPLETED,
          completedAt: now.toISOString(),
        });
        console.log(`Auto: appointment #${apt.id} → completed (skipped in_progress)`);
        continue;
      }

      // in_progress → completed (время закончилось)
      if (apt.status === AppointmentStatus.IN_PROGRESS && currentMinutes >= endMin) {
        await this.repo.update(apt.id, {
          status: AppointmentStatus.COMPLETED,
          completedAt: now.toISOString(),
        });
        console.log(`Auto: appointment #${apt.id} → completed`);
      }
    }

    // Завершаем все scheduled/in_progress прошедших дней
    const pastApts = await this.repo
      .createQueryBuilder('apt')
      .where('apt.date < :today', { today })
      .andWhere('apt.status IN (:...statuses)', { statuses: ['scheduled', 'in_progress'] })
      .getMany();

    for (const apt of pastApts) {
      await this.repo.update(apt.id, {
        status: AppointmentStatus.COMPLETED,
        completedAt: now.toISOString(),
      });
      console.log(`Auto: past appointment #${apt.id} → completed`);
    }
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private guessStudyType(serviceName: string): string {
    const n = (serviceName || '').toLowerCase();
    if (n.includes('мрт') || n.includes('mri'))                       return 'mri';
    if (n.includes('кт') || n.includes('компьютерн') || n.includes('ct')) return 'ct';
    if (n.includes('рентген') || n.includes('xray'))                  return 'xray';
    if (n.includes('узи') || n.includes('ультразвук'))                return 'ultrasound';
    if (n.includes('пэт') || n.includes('pet'))                       return 'pet';
    return 'mri';
  }
}
