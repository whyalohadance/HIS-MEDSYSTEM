import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private repo: Repository<Schedule>,
  ) {}

  async findAll(): Promise<Schedule[]> {
    return this.repo.find({ order: { dayOfWeek: 'ASC' } });
  }

  async findByDoctor(doctorId: number): Promise<Schedule[]> {
    return this.repo.find({ where: { doctorId } });
  }

  async create(dto: CreateScheduleDto): Promise<Schedule> {
    const schedule = this.repo.create(dto);
    return this.repo.save(schedule);
  }

  async update(id: number, dto: Partial<CreateScheduleDto>): Promise<Schedule> {
    await this.repo.update(id, dto);
    const updated = await this.repo.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('График не найден');
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
