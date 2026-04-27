import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Study, StudyStatus } from './study.entity';
import { Modality } from './modality.entity';
import { Series } from './series.entity';
import { DicomImage } from './dicom-image.entity';
import { Measurement } from './measurement.entity';
import { Annotation } from './annotation.entity';
import { CreateStudyDto } from './dto/create-study.dto';
import { UpdateStudyDto } from './dto/update-study.dto';
import * as PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { Patient } from '../patients/patient.entity';
import { User } from '../users/user.entity';

@Injectable()
export class StudiesService {
  constructor(
    @InjectRepository(Study)
    private studyRepo: Repository<Study>,
    @InjectRepository(Modality)
    private modalityRepo: Repository<Modality>,
    @InjectRepository(Series)
    private seriesRepo: Repository<Series>,
    @InjectRepository(DicomImage)
    private dicomImageRepo: Repository<DicomImage>,
    @InjectRepository(Measurement)
    private measurementRepo: Repository<Measurement>,
    @InjectRepository(Annotation)
    private annotationRepo: Repository<Annotation>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
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

  async saveReport(studyId: number, userId: number, dto: any): Promise<Study> {
    await this.studyRepo.update(studyId, {
      findings: dto.findings,
      conclusion: dto.conclusion,
      status: StudyStatus.COMPLETED,
      reportedAt: new Date(),
      reportedById: userId,
      completedAt: new Date().toISOString().split('T')[0],
    });
    return this.studyRepo.findOne({ where: { id: studyId } }) as Promise<Study>;
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

  async findSeriesByStudy(studyId: number): Promise<Series[]> {
    return this.seriesRepo.find({
      where: { studyId },
      order: { seriesNumber: 'ASC' }
    });
  }

  async findImagesBySeries(seriesId: number): Promise<DicomImage[]> {
    return this.dicomImageRepo.find({
      where: { seriesId },
      order: { instanceNumber: 'ASC' }
    });
  }

  // ===== MEASUREMENTS =====
  async findMeasurements(studyId: number): Promise<Measurement[]> {
    return this.measurementRepo.find({
      where: { studyId },
      order: { createdAt: 'DESC' }
    });
  }

  async createMeasurement(studyId: number, userId: number, dto: any): Promise<Measurement> {
    const m = this.measurementRepo.create({
      studyId,
      userId,
      type: dto.type || 'length',
      x1: dto.x1,
      y1: dto.y1,
      x2: dto.x2,
      y2: dto.y2,
      distance: dto.distance,
      sliceIndex: dto.sliceIndex,
      note: dto.note
    });
    return this.measurementRepo.save(m);
  }

  async deleteMeasurement(id: number): Promise<void> {
    await this.measurementRepo.delete(id);
  }

  async deleteAllMeasurements(studyId: number): Promise<void> {
    await this.measurementRepo.delete({ studyId });
  }

  // ===== ANNOTATIONS =====
  async findAnnotations(studyId: number): Promise<Annotation[]> {
    return this.annotationRepo.find({
      where: { studyId },
      order: { createdAt: 'ASC' }
    });
  }

  async createAnnotation(studyId: number, userId: number, dto: any): Promise<Annotation> {
    const a = this.annotationRepo.create({
      studyId,
      userId,
      x: dto.x,
      y: dto.y,
      labelX: dto.labelX,
      labelY: dto.labelY,
      text: dto.text,
      color: dto.color || '#ef4444',
      sliceIndex: dto.sliceIndex
    });
    return this.annotationRepo.save(a);
  }

  async deleteAnnotation(id: number): Promise<void> {
    await this.annotationRepo.delete(id);
  }

  async deleteAllAnnotations(studyId: number): Promise<void> {
    await this.annotationRepo.delete({ studyId });
  }

  async generateReportPDF(studyId: number, lang: string, res: Response): Promise<void> {
    const study = await this.studyRepo.findOne({ where: { id: studyId } });
    if (!study) throw new NotFoundException('Исследование не найдено');

    const patient = await this.patientRepo.findOne({ where: { id: study.patientId } });
    const radiologist = study.reportedById
      ? await this.userRepo.findOne({ where: { id: study.reportedById } })
      : null;
    const measurements = await this.measurementRepo.find({ where: { studyId } });
    const annotations = await this.annotationRepo.find({ where: { studyId } });

    const fontsDir = path.join(process.cwd(), 'fonts');
    const arialRegular = path.join(fontsDir, 'Arial.ttf');
    const arialBold = path.join(fontsDir, 'Arial-Bold.ttf');
    const hasArial = fs.existsSync(arialRegular) && fs.existsSync(arialBold);

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    if (hasArial) {
      doc.registerFont('Main', arialRegular);
      doc.registerFont('Bold', arialBold);
    }

    const FONT = hasArial ? 'Main' : 'Helvetica';
    const BOLD = hasArial ? 'Bold' : 'Helvetica-Bold';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="study_${study.studyId}.pdf"`);
    doc.pipe(res);

    // ── Header ─────────────────────────────────────────────
    doc.rect(0, 0, 595, 80).fill('#7c3aed');
    doc.fillColor('white').font(BOLD).fontSize(22);
    doc.text('HIS-MedSystem', 40, 25);
    doc.font(FONT).fontSize(10);
    doc.text('Радиологическое заключение', 40, 52);
    doc.font(FONT).fontSize(10);
    doc.text(`№ ${study.studyId}`, 400, 30, { align: 'right', width: 150 });
    doc.text(new Date().toISOString().split('T')[0], 400, 52, { align: 'right', width: 150 });

    doc.fillColor('black');
    (doc as any).y = 100;

    // ── Patient block ───────────────────────────────────────
    doc.font(BOLD).fontSize(14).fillColor('#0f2d52');
    doc.text('Информация о пациенте');
    doc.moveDown(0.3);
    doc.font(FONT).fontSize(10).fillColor('#1e293b');
    if (patient) {
      doc.text(`ФИО: ${patient.firstName} ${patient.lastName}`);
      if (patient.dateOfBirth) doc.text(`Дата рождения: ${patient.dateOfBirth}`);
      if (patient.phone) doc.text(`Телефон: ${patient.phone}`);
      if (patient.gender) doc.text(`Пол: ${patient.gender === 'male' ? 'Мужской' : patient.gender === 'female' ? 'Женский' : patient.gender}`);
    }
    doc.moveDown(1);

    // ── Study info ──────────────────────────────────────────
    doc.font(BOLD).fontSize(14).fillColor('#0f2d52');
    doc.text('Параметры исследования');
    doc.moveDown(0.3);
    doc.font(FONT).fontSize(10).fillColor('#1e293b');

    const typeLabels: any = { mri: 'МРТ', ct: 'КТ', xray: 'Рентген', ultrasound: 'УЗИ', mammography: 'Маммография' };
    doc.text(`Тип исследования: ${typeLabels[study.type] || study.type}`);
    if (study.bodyPart) doc.text(`Область: ${study.bodyPart}`);
    if (study.description) doc.text(`Описание: ${study.description}`);
    if (study.scheduledAt) doc.text(`Дата проведения: ${study.scheduledAt}${study.scheduledTime ? ' ' + study.scheduledTime : ''}`);
    if (study.priority && study.priority !== 'routine') {
      const priorityLabel = study.priority === 'stat' ? 'КРИТИЧНО' : 'СРОЧНО';
      doc.fillColor(study.priority === 'stat' ? '#dc2626' : '#d97706');
      doc.font(BOLD).text(`Приоритет: ${priorityLabel}`);
      doc.font(FONT).fillColor('#1e293b');
    }
    doc.moveDown(1);

    // ── Clinical info ───────────────────────────────────────
    if (study.clinicalInfo) {
      doc.font(BOLD).fontSize(12).fillColor('#0f2d52');
      doc.text('Клиническая информация');
      doc.moveDown(0.3);
      doc.font(FONT).fontSize(10).fillColor('#1e40af');
      doc.text(study.clinicalInfo, { width: 515, align: 'left', lineGap: 2 });
      doc.fillColor('#1e293b');
      doc.moveDown(1);
    }

    // ── Findings ────────────────────────────────────────────
    if (study.findings) {
      doc.font(BOLD).fontSize(14).fillColor('#0f2d52');
      doc.text('FINDINGS');
      doc.moveDown(0.3);
      doc.font(FONT).fontSize(10).fillColor('#1e293b');
      doc.text(study.findings, { align: 'left', lineGap: 3, width: 515 });
      doc.moveDown(1);
    }

    // ── Conclusion ──────────────────────────────────────────
    if (study.conclusion) {
      doc.font(BOLD).fontSize(14).fillColor('#6d28d9');
      doc.text('ЗАКЛЮЧЕНИЕ');
      doc.moveDown(0.3);
      doc.font(FONT).fontSize(11).fillColor('#1e1b4b');
      doc.text(study.conclusion, { width: 515, lineGap: 3 });
      doc.moveDown(1);
    }

    // ── Measurements ────────────────────────────────────────
    if (measurements && measurements.length > 0) {
      doc.font(BOLD).fontSize(12).fillColor('#0f2d52');
      doc.text(`Измерения (${measurements.length})`);
      doc.moveDown(0.3);
      doc.font(FONT).fontSize(9).fillColor('#1e293b');
      measurements.forEach((m: any, i: number) => {
        const dx = (m.x2 || 0) - (m.x1 || 0);
        const dy = (m.y2 || 0) - (m.y1 || 0);
        const pixels = Math.sqrt(dx * dx + dy * dy).toFixed(1);
        doc.text(`${i + 1}. Расстояние ${m.distance} (${pixels} px)`);
      });
      doc.moveDown(1);
    }

    // ── Annotations ─────────────────────────────────────────
    if (annotations && annotations.length > 0) {
      doc.font(BOLD).fontSize(12).fillColor('#0f2d52');
      doc.text(`Аннотации (${annotations.length})`);
      doc.moveDown(0.3);
      doc.font(FONT).fontSize(9).fillColor('#1e293b');
      annotations.forEach((a: any, i: number) => {
        doc.text(`${i + 1}. ${a.text}`);
      });
      doc.moveDown(1);
    }

    // ── No report placeholder ────────────────────────────────
    if (!study.findings && !study.conclusion) {
      doc.font(BOLD).fontSize(11).fillColor('#d97706');
      doc.text('Заключение ещё не подготовлено радиологом');
      doc.moveDown(1);
    }

    // ── Signature ────────────────────────────────────────────
    doc.moveDown(1);
    doc.font(BOLD).fontSize(11).fillColor('#0f2d52');
    doc.text('Подпись:');
    doc.moveDown(0.3);
    doc.font(FONT).fontSize(10).fillColor('#1e293b');
    if (radiologist) {
      doc.text(`Радиолог: ${radiologist.firstName} ${radiologist.lastName}`);
      if (study.reportedAt) {
        const date = new Date(study.reportedAt).toISOString().split('T')[0];
        doc.text(`Дата заключения: ${date}`);
      }
    } else {
      doc.text('Радиолог: ___________________');
      doc.text('Дата: _____________');
    }
    doc.moveDown(0.5);
    doc.text('Подпись: ___________________');

    // ── Footer ────────────────────────────────────────────────
    doc.font(FONT).fontSize(8).fillColor('#94a3b8');
    doc.text(
      '© HIS-MedSystem · CUTM 2026 · Заключение действительно только при наличии оригинальных DICOM снимков',
      40, 780, { align: 'center', width: 515 },
    );

    doc.end();
  }
}
