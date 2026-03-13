import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private repo: Repository<Appointment>,
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
    return saved as unknown as Appointment;
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
