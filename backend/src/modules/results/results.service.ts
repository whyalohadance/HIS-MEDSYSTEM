import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from './result.entity';
import { join } from 'path';
import * as mammoth from 'mammoth';

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

  async preview(id: number): Promise<{ type: string; content?: string; url?: string }> {
    const result = await this.repo.findOne({ where: { id } });
    if (!result || !result.fileUrl) throw new NotFoundException('Файл не найден');

    // fileUrl may be a full URL (http://localhost:3000/uploads/name.docx) or a path (/uploads/name.docx)
    const fileName = result.fileUrl.split('/').pop() || '';
    const filePath = join(process.cwd(), 'uploads', fileName);

    if (/\.(docx?)$/i.test(fileName)) {
      const { value: html } = await mammoth.convertToHtml({ path: filePath });
      return { type: 'html', content: html };
    }

    if (/\.pdf$/i.test(fileName)) {
      return { type: 'pdf', url: result.fileUrl };
    }

    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
      return { type: 'image', url: result.fileUrl };
    }

    return { type: 'unsupported', url: result.fileUrl };
  }
}
