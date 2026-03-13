import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from './result.entity';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(Result)
    private repo: Repository<Result>,
  ) {}

  async findAll(userId: number, userRole: string): Promise<Result[]> {
    if (userRole === 'admin' || userRole === 'receptionist') {
      return this.repo.find({ order: { createdAt: 'DESC' } });
    }
    return this.repo.find({ where: { doctorId: userId }, order: { createdAt: 'DESC' } });
  }

  async create(dto: any, userId: number, userRole: string): Promise<Result> {
    if (userRole !== 'doctor' && userRole !== 'admin') {
      throw new ForbiddenException('Только врач может добавлять результаты');
    }
    const result = this.repo.create({ ...dto, doctorId: userId });
    const saved = await this.repo.save(result);
    return saved as unknown as Result;
  }

  async remove(id: number, userId: number, userRole: string): Promise<void> {
    const result = await this.repo.findOne({ where: { id } });
    if (!result) throw new NotFoundException('Результат не найден');
    if (userRole === 'doctor' && result.doctorId !== userId) throw new ForbiddenException('Нет доступа');
    await this.repo.remove(result);
  }
}
