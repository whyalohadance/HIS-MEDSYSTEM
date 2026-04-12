import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Study, StudyStatus } from './study.entity';
import { Modality } from './modality.entity';
import { CreateStudyDto } from './dto/create-study.dto';
import { UpdateStudyDto } from './dto/update-study.dto';

@Injectable()
export class StudiesService {
  constructor(
    @InjectRepository(Study)
    private studyRepo: Repository<Study>,
    @InjectRepository(Modality)
    private modalityRepo: Repository<Modality>
  ) {}

  private generateStudyId(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `STU-${year}${month}${day}-${random}`;
  }

  async findAll(filters?: any): Promise<Study[]> {
    const query = this.studyRepo.createQueryBuilder('study')
      .orderBy('study.createdAt', 'DESC');

    if (filters?.patientId) {
      query.andWhere('study.patientId = :patientId', { patientId: filters.patientId });
    }
    if (filters?.status) {
      query.andWhere('study.status = :status', { status: filters.status });
    }
    if (filters?.type) {
      query.andWhere('study.type = :type', { type: filters.type });
    }
    if (filters?.radiologistId) {
      query.andWhere('study.radiologistId = :radiologistId', { radiologistId: filters.radiologistId });
    }
    if (filters?.date) {
      query.andWhere('study.scheduledAt = :date', { date: filters.date });
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Study> {
    const study = await this.studyRepo.findOne({ where: { id } });
    if (!study) throw new NotFoundException('Исследование не найдено');
    return study;
  }

  async findByPatient(patientId: number): Promise<Study[]> {
    return this.studyRepo.find({
      where: { patientId },
      order: { createdAt: 'DESC' }
    });
  }

  async findWorklist(): Promise<Study[]> {
    return this.studyRepo.find({
      where: [
        { status: StudyStatus.PENDING },
        { status: StudyStatus.SCHEDULED },
        { status: StudyStatus.IN_PROGRESS }
      ],
      order: { scheduledAt: 'ASC', createdAt: 'ASC' }
    });
  }

  async create(dto: CreateStudyDto): Promise<Study> {
    const study = this.studyRepo.create({
      ...dto,
      studyId: this.generateStudyId(),
      status: StudyStatus.PENDING
    });
    return this.studyRepo.save(study);
  }

  async update(id: number, dto: UpdateStudyDto): Promise<Study> {
    const study = await this.findOne(id);
    if (dto.status === StudyStatus.COMPLETED && !study.completedAt) {
      dto.completedAt = new Date().toISOString().split('T')[0];
    }
    await this.studyRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.studyRepo.delete(id);
  }

  async getStats(): Promise<any> {
    const total = await this.studyRepo.count();
    const pending = await this.studyRepo.count({ where: { status: StudyStatus.PENDING } });
    const inProgress = await this.studyRepo.count({ where: { status: StudyStatus.IN_PROGRESS } });
    const completed = await this.studyRepo.count({ where: { status: StudyStatus.COMPLETED } });
    const cancelled = await this.studyRepo.count({ where: { status: StudyStatus.CANCELLED } });
    return { total, pending, inProgress, completed, cancelled };
  }

  async findAllModalities(): Promise<Modality[]> {
    return this.modalityRepo.find({ order: { name: 'ASC' } });
  }

  async createModality(dto: any): Promise<Modality> {
    const modality = this.modalityRepo.create(dto);
    return this.modalityRepo.save(modality) as unknown as Promise<Modality>;
  }

  async updateModality(id: number, dto: any): Promise<Modality> {
    await this.modalityRepo.update(id, dto);
    const modality = await this.modalityRepo.findOne({ where: { id } });
    if (!modality) throw new NotFoundException('Echipament negăsit');
    return modality;
  }

  async removeModality(id: number): Promise<void> {
    await this.modalityRepo.delete(id);
  }
}
