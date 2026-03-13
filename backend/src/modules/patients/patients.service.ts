import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { Appointment } from '../appointments/appointment.entity';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private repo: Repository<Patient>,
    @InjectRepository(Appointment)
    private appointmentsRepo: Repository<Appointment>,
  ) {}

  async findAll(userId: number, userRole: string): Promise<Patient[]> {
    // Админ и регистратура видят всех пациентов
    if (userRole === 'admin' || userRole === 'receptionist') {
      return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    // Доктор видит всех пациентов (результаты/приёмы только своим)
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Patient> {
    const patient = await this.repo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException('Пациент не найден');
    return patient;
  }

  async create(dto: CreatePatientDto, doctorId: number): Promise<Patient> {
    const patient = this.repo.create({ ...dto, doctorId });
    return this.repo.save(patient);
  }

  async update(id: number, dto: Partial<CreatePatientDto>): Promise<Patient> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.appointmentsRepo.delete({ patientId: id });
    await this.repo.delete(id);
  }
}
