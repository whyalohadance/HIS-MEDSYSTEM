import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import PDFDocument = require('pdfkit');
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { Appointment } from '../appointments/appointment.entity';
import { Patient } from '../patients/patient.entity';
import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';

const FONTS_DIR = path.join(process.cwd(), 'fonts');

function getFont(name: string): string | null {
  const p = path.join(FONTS_DIR, name);
  return fs.existsSync(p) ? p : null;
}

export interface ReportData {
  month: number;
  year: number;
  appointments: any[];
  patients: any[];
  staff: any[];
  rooms: any[];
  totalRevenue: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  newPatients: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Appointment) private appointmentsRepo: Repository<Appointment>,
    @InjectRepository(Patient) private patientsRepo: Repository<Patient>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Room) private roomsRepo: Repository<Room>,
  ) {}

  async getReportData(month: number, year: number): Promise<ReportData> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

    const appointments = await this.appointmentsRepo.find({
      where: { date: Between(startDate, endDate) },
      relations: ['patient', 'doctor'],
      order: { date: 'ASC', time: 'ASC' },
    });

    const allPatients = await this.patientsRepo.find({ order: { createdAt: 'ASC' } });
    const newPatients = allPatients.filter(p => {
      const created = new Date(p.createdAt);
      return created.getMonth() + 1 === month && created.getFullYear() === year;
    });

    const staff = await this.usersRepo.find({ order: { createdAt: 'ASC' } });
    const rooms = await this.roomsRepo.find({ order: { name: 'ASC' } });

    const completedApts = appointments.filter(a => a.status === 'completed');
    const totalRevenue = completedApts.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    return {
      month, year,
      appointments,
      patients: allPatients,
      staff,
      rooms,
      totalRevenue,
      totalAppointments: appointments.length,
      completedAppointments: completedApts.length,
      cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
      newPatients: newPatients.length,
    };
  }

  async generatePDF(month: number, year: number, res: Response): Promise<void> {
    const data = await this.getReportData(month, year);

    // Font setup — Arial Unicode supports Cyrillic and is bundled in fonts/
    const regularFont = getFont('Arial.ttf');
    const boldFont = getFont('Arial-Bold.ttf') || getFont('Arial Bold.ttf');

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    const FONT_MAIN = regularFont ? 'Main' : 'Helvetica';
    const FONT_BOLD = boldFont ? 'Bold' : 'Helvetica-Bold';

    if (regularFont) doc.registerFont('Main', regularFont);
    if (boldFont) doc.registerFont('Bold', boldFont);

    const monthNames = ['', 'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report_${month}_${year}.pdf"`,
    );

    // Pipe BEFORE writing any content
    doc.pipe(res);

    // ── Title ──────────────────────────────────────────────
    doc.font(FONT_BOLD).fontSize(22).fillColor('#0f2d52');
    doc.text('Отчёт HIS-MedSystem', { align: 'center' });

    doc.font(FONT_MAIN).fontSize(14).fillColor('#475569');
    doc.text(`${monthNames[month]} ${year}`, { align: 'center' });

    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#94a3b8');
    doc.text(`Сформирован: ${new Date().toISOString().split('T')[0]}`, { align: 'center' });

    doc.moveDown(2);

    // ── Separator ──────────────────────────────────────────
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(1);

    // ── Section 1: Stats ──────────────────────────────────
    doc.font(FONT_BOLD).fontSize(16).fillColor('#0f2d52');
    doc.text('1. Общая статистика');
    doc.moveDown(0.5);

    const rows: [string, string][] = [
      ['Всего приёмов:', String(data.totalAppointments)],
      ['Завершено:', String(data.completedAppointments)],
      ['Отменено:', String(data.cancelledAppointments)],
      ['Новых пациентов:', String(data.newPatients)],
      ['Всего пациентов:', String(data.patients.length)],
      ['Сотрудников:', String(data.staff.length)],
      ['Общий доход:', `${data.totalRevenue.toFixed(2)} MDL`],
    ];

    rows.forEach(([label, value]) => {
      const y = doc.y;
      doc.font(FONT_MAIN).fontSize(11).fillColor('#475569').text(label, 60, y, { width: 200 });
      doc.font(FONT_BOLD).fontSize(11).fillColor('#0f2d52').text(value, 270, y);
      doc.moveDown(0.4);
    });

    doc.moveDown(1);

    // ── Section 2: Doctor stats ───────────────────────────
    const doctorGroups = new Map<number, { name: string; total: number; done: number; revenue: number }>();
    data.appointments.forEach(a => {
      const id = a.doctorId;
      if (!doctorGroups.has(id)) {
        const name = a.doctor
          ? `${a.doctor.lastName} ${a.doctor.firstName}`
          : `Врач #${id}`;
        doctorGroups.set(id, { name, total: 0, done: 0, revenue: 0 });
      }
      const g = doctorGroups.get(id)!;
      g.total++;
      if (a.status === 'completed') { g.done++; g.revenue += Number(a.price) || 0; }
    });

    if (doctorGroups.size > 0) {
      doc.font(FONT_BOLD).fontSize(16).fillColor('#0f2d52');
      doc.text('2. Статистика по врачам');
      doc.moveDown(0.5);

      doctorGroups.forEach(g => {
        doc.font(FONT_BOLD).fontSize(11).fillColor('#0f2d52').text(g.name);
        doc.font(FONT_MAIN).fontSize(10).fillColor('#64748b')
          .text(`Приёмов: ${g.total}  ·  Завершено: ${g.done}  ·  Доход: ${g.revenue.toFixed(2)} MDL`);
        doc.moveDown(0.4);
      });
      doc.moveDown(0.8);
    }

    // ── Section 3: Appointments list ──────────────────────
    if (data.appointments.length > 0) {
      doc.font(FONT_BOLD).fontSize(16).fillColor('#0f2d52');
      doc.text(`3. Приёмы (${data.appointments.length})`);
      doc.moveDown(0.5);

      const limit = Math.min(50, data.appointments.length);
      doc.font(FONT_MAIN).fontSize(9).fillColor('#1e293b');

      for (let i = 0; i < limit; i++) {
        const a = data.appointments[i];
        const patient = a.patient
          ? `${a.patient.lastName} ${a.patient.firstName}`
          : `#${a.patientId}`;
        const doctor = a.doctor
          ? `${a.doctor.lastName} ${a.doctor.firstName}`
          : `#${a.doctorId}`;
        doc.text(
          `${i + 1}. ${a.date}  ${a.time || '--:--'}  |  ${patient}  |  ${doctor}  |  ${a.status}  |  ${(Number(a.price) || 0).toFixed(2)} MDL`,
        );
      }

      if (data.appointments.length > limit) {
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#94a3b8')
          .text(`... и ещё ${data.appointments.length - limit} приёмов доступны в Excel-отчёте`);
      }
    } else {
      doc.font(FONT_MAIN).fontSize(11).fillColor('#94a3b8')
        .text('Приёмов за этот месяц нет.');
    }

    doc.moveDown(2);

    // ── Footer ────────────────────────────────────────────
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.font(FONT_MAIN).fontSize(8).fillColor('#94a3b8')
      .text('© HIS-MedSystem · CUTM 2026', { align: 'center' });

    doc.end();
  }

  async generateExcel(month: number, year: number): Promise<Buffer> {
    const data = await this.getReportData(month, year);
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь',
      'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HIS-MedSystem';
    workbook.created = new Date();

    // Sheet 1 — Summary
    const summarySheet = workbook.addWorksheet('Сводка');
    summarySheet.columns = [
      { header: 'Параметр', key: 'param', width: 30 },
      { header: 'Значение', key: 'value', width: 20 },
    ];
    summarySheet.addRows([
      { param: 'Месяц', value: `${monthNames[month - 1]} ${year}` },
      { param: 'Всего приёмов', value: data.totalAppointments },
      { param: 'Завершённых приёмов', value: data.completedAppointments },
      { param: 'Отменённых приёмов', value: data.cancelledAppointments },
      { param: 'Новых пациентов', value: data.newPatients },
      { param: 'Всего пациентов', value: data.patients.length },
      { param: 'Сотрудников', value: data.staff.length },
      { param: 'Кабинетов', value: data.rooms.length },
      { param: 'Общая выручка (MDL)', value: data.totalRevenue },
    ]);
    summarySheet.getRow(1).font = { bold: true };

    // Sheet 2 — Appointments
    const aptsSheet = workbook.addWorksheet('Приёмы');
    aptsSheet.columns = [
      { header: '№', key: 'num', width: 5 },
      { header: 'Дата', key: 'date', width: 12 },
      { header: 'Время', key: 'time', width: 8 },
      { header: 'Пациент', key: 'patient', width: 25 },
      { header: 'Врач', key: 'doctor', width: 25 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Цена (MDL)', key: 'price', width: 12 },
      { header: 'Примечания', key: 'notes', width: 30 },
    ];
    data.appointments.forEach((a, i) => {
      aptsSheet.addRow({
        num: i + 1,
        date: a.date,
        time: a.time,
        patient: a.patient ? `${a.patient.lastName} ${a.patient.firstName}` : `#${a.patientId}`,
        doctor: a.doctor ? `${a.doctor.lastName} ${a.doctor.firstName}` : `#${a.doctorId}`,
        status: a.status,
        price: a.price || 0,
        notes: a.notes || '',
      });
    });
    aptsSheet.getRow(1).font = { bold: true };

    // Sheet 3 — Patients
    const patientsSheet = workbook.addWorksheet('Пациенты');
    patientsSheet.columns = [
      { header: '№', key: 'num', width: 5 },
      { header: 'Имя', key: 'firstName', width: 15 },
      { header: 'Фамилия', key: 'lastName', width: 15 },
      { header: 'Дата рождения', key: 'dob', width: 15 },
      { header: 'Телефон', key: 'phone', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Город', key: 'city', width: 15 },
      { header: 'Страна', key: 'country', width: 15 },
    ];
    data.patients.forEach((p, i) => {
      patientsSheet.addRow({
        num: i + 1,
        firstName: p.firstName,
        lastName: p.lastName,
        dob: p.dateOfBirth || '',
        phone: p.phone || '',
        email: p.email || '',
        city: p.city || '',
        country: p.country || '',
      });
    });
    patientsSheet.getRow(1).font = { bold: true };

    // Sheet 4 — Staff
    const staffSheet = workbook.addWorksheet('Персонал');
    staffSheet.columns = [
      { header: '№', key: 'num', width: 5 },
      { header: 'Имя', key: 'firstName', width: 15 },
      { header: 'Фамилия', key: 'lastName', width: 15 },
      { header: 'Роль', key: 'role', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Телефон', key: 'phone', width: 15 },
    ];
    data.staff.forEach((s, i) => {
      staffSheet.addRow({
        num: i + 1,
        firstName: s.firstName,
        lastName: s.lastName,
        role: s.role,
        email: s.email,
        phone: s.phone || '',
      });
    });
    staffSheet.getRow(1).font = { bold: true };

    // Sheet 5 — Rooms
    const roomsSheet = workbook.addWorksheet('Кабинеты');
    roomsSheet.columns = [
      { header: '№', key: 'num', width: 5 },
      { header: 'Название', key: 'name', width: 25 },
      { header: 'Номер', key: 'number', width: 10 },
      { header: 'Этаж', key: 'floor', width: 8 },
      { header: 'Описание', key: 'description', width: 30 },
    ];
    data.rooms.forEach((r, i) => {
      roomsSheet.addRow({
        num: i + 1,
        name: r.name,
        number: r.number || '',
        floor: r.floor || '',
        description: r.description || '',
      });
    });
    roomsSheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
