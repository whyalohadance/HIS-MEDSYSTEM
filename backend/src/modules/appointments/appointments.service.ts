import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    // Auto-workflow: create Study or LabOrder based on room type
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

  private guessStudyType(serviceName: string): string {
    const n = (serviceName || '').toLowerCase();
    if (n.includes('мрт') || n.includes('mri'))                     return 'mri';
    if (n.includes('кт') || n.includes('компьютерн') || n.includes('ct')) return 'ct';
    if (n.includes('рентген') || n.includes('xray'))                return 'xray';
    if (n.includes('узи') || n.includes('ультразвук'))              return 'ultrasound';
    if (n.includes('пэт') || n.includes('pet'))                     return 'pet';
    return 'mri';
  }

  async updateStatus(id: number, status: AppointmentStatus, userId: number, userRole: string): Promise<Appointment> {
    const apt = await this.repo.findOne({ where: { id } });
    if (!apt) throw new NotFoundException('Приём не найден');
    if (userRole === 'doctor' && apt.doctorId !== userId) throw new ForbiddenException('Нет доступа');
    apt.status = status;
    return this.repo.save(apt);
  }

  async remove(id: number, userId: number, userRole: string): Promise<void> {
    const apt = await this.repo.findOne({ where: { id } });
    if (!apt) throw new NotFoundException('Приём не найден');
    if (userRole !== 'admin' && userRole !== 'receptionist') throw new ForbiddenException('Нет доступа');
    await this.repo.remove(apt);
  }
}
