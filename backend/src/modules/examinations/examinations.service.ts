import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Examination } from './examination.entity';
import { CreateExaminationDto } from './dto/create-examination.dto';

@Injectable()
export class ExaminationsService {
  constructor(
    @InjectRepository(Examination)
    private repo: Repository<Examination>,
  ) {}

  async findAll(): Promise<Examination[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Examination> {
    const exam = await this.repo.findOne({ where: { id } });
    if (!exam) throw new NotFoundException('Обследование не найдено');
    return exam;
  }

  async create(dto: CreateExaminationDto): Promise<Examination> {
    const exam = this.repo.create(dto);
    return this.repo.save(exam);
  }

  async update(id: number, dto: Partial<CreateExaminationDto>): Promise<Examination> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
