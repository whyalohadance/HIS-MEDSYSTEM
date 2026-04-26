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
import { getTranslations } from './translations';

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

  /** Build doctor stats map from appointments list */
  private buildDoctorStats(appointments: any[]): Map<number, any> {
    const map = new Map<number, any>();
    appointments.forEach(a => {
      if (!map.has(a.doctorId)) {
        const name = a.doctor
          ? { firstName: a.doctor.firstName, lastName: a.doctor.lastName }
          : { firstName: `#${a.doctorId}`, lastName: '' };
        map.set(a.doctorId, { ...name, total: 0, completed: 0, revenue: 0 });
      }
      const g = map.get(a.doctorId)!;
      g.total++;
      if (a.status === 'completed') {
        g.completed++;
        g.revenue += Number(a.price) || 0;
      }
    });
    return map;
  }

  async generatePDF(month: number, year: number, lang: string, res: Response): Promise<void> {
    const data = await this.getReportData(month, year);
    const t = getTranslations(lang);

    const regularFont = getFont('Arial.ttf');
    const boldFont = getFont('Arial-Bold.ttf');

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });

    const FONT_MAIN = regularFont ? 'Main' : 'Helvetica';
    const FONT_BOLD = boldFont ? 'Bold' : 'Helvetica-Bold';

    if (regularFont) doc.registerFont('Main', regularFont);
    if (boldFont) doc.registerFont('Bold', boldFont);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report_${month}_${year}_${lang}.pdf"`,
    );

    // Pipe BEFORE any content
    doc.pipe(res);

    // ── Title ──────────────────────────────────────────────
    doc.font(FONT_BOLD).fontSize(22).fillColor('#0f2d52');
    doc.text(t.title, { align: 'center' });

    doc.font(FONT_MAIN).fontSize(14).fillColor('#475569');
    doc.text(t.monthYear(t.months[month], year), { align: 'center' });

    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#94a3b8');
    doc.text(`HIS-MedSystem · ${t.generated}: ${new Date().toISOString().split('T')[0]}`, { align: 'center' });
    doc.moveDown(1.5);

    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(1);

    // ── Section 1: Overview ────────────────────────────────
    doc.font(FONT_BOLD).fontSize(16).fillColor('#0f2d52');
    doc.text(`1. ${t.overview}`);
    doc.moveDown(0.5);

    const rows: [string, string][] = [
      [t.totalAppointments, String(data.totalAppointments)],
      [t.completed,         String(data.completedAppointments)],
      [t.cancelled,         String(data.cancelledAppointments)],
      [t.newPatients,       String(data.newPatients)],
      [t.totalPatients,     String(data.patients.length)],
      [t.totalStaff,        String(data.staff.length)],
      [t.totalRevenue,      `${data.totalRevenue.toFixed(2)} MDL`],
    ];

    rows.forEach(([label, value]) => {
      const y = doc.y;
      doc.font(FONT_MAIN).fontSize(11).fillColor('#475569').text(`${label}:`, 60, y, { width: 210 });
      doc.font(FONT_BOLD).fontSize(11).fillColor('#0f2d52').text(value, 280, y);
      doc.moveDown(0.4);
    });

    doc.moveDown(1);

    // ── Section 2: Doctor stats ────────────────────────────
    const doctorStats = this.buildDoctorStats(data.appointments);
    if (doctorStats.size > 0) {
      doc.font(FONT_BOLD).fontSize(16).fillColor('#0f2d52');
      doc.text(`2. ${t.doctorStats}`);
      doc.moveDown(0.5);

      doctorStats.forEach(g => {
        const name = `${g.firstName} ${g.lastName}`.trim();
        const info = `${t.doctorAppointments(g.total)} · ${t.completed.toLowerCase()}: ${g.completed} · ${t.doctorRevenue}: ${g.revenue.toFixed(2)} MDL`;
        doc.font(FONT_BOLD).fontSize(11).fillColor('#0f2d52').text(name);
        doc.font(FONT_MAIN).fontSize(10).fillColor('#64748b').text(info);
        doc.moveDown(0.4);
      });
      doc.moveDown(0.8);
    }

    // ── Section 3: Appointments list ──────────────────────
    const sectionNum = doctorStats.size > 0 ? 3 : 2;
    if (data.appointments.length > 0) {
      doc.font(FONT_BOLD).fontSize(16).fillColor('#0f2d52');
      doc.text(`${sectionNum}. ${t.appointmentsList} (${data.appointments.length})`);
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
        const status = t.statusLabels[a.status] || a.status;
        doc.text(
          `${i + 1}. ${a.date}  ${a.time || '--:--'}  |  ${patient}  |  ${doctor}  |  ${status}  |  ${(Number(a.price) || 0).toFixed(2)} MDL`,
        );
      }

      if (data.appointments.length > limit) {
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#94a3b8').text(t.moreAppointments(data.appointments.length - limit));
      }
    } else {
      doc.font(FONT_MAIN).fontSize(11).fillColor('#94a3b8').text(t.appointmentsList + ': —');
    }

    // ── Footer ────────────────────────────────────────────
    doc.moveDown(2);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.font(FONT_MAIN).fontSize(8).fillColor('#94a3b8').text(t.footer, { align: 'center' });

    doc.end();
  }

  async generateExcel(month: number, year: number, lang: string, res: Response): Promise<void> {
    const data = await this.getReportData(month, year);
    const t = getTranslations(lang);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HIS-MedSystem';
    workbook.created = new Date();

    // Sheet 1 — Summary
    const sheet1 = workbook.addWorksheet(t.excel.sheet1);
    sheet1.columns = [
      { header: t.excel.indicator, key: 'name', width: 30 },
      { header: t.excel.value, key: 'value', width: 20 },
    ];
    sheet1.addRows([
      { name: t.excel.monthYear, value: `${t.months[month]} ${year}` },
      { name: t.totalAppointments, value: data.totalAppointments },
      { name: t.completed, value: data.completedAppointments },
      { name: t.cancelled, value: data.cancelledAppointments },
      { name: t.newPatients, value: data.newPatients },
      { name: t.totalPatients, value: data.patients.length },
      { name: t.totalStaff, value: data.staff.length },
      { name: `${t.totalRevenue} (MDL)`, value: data.totalRevenue.toFixed(2) },
    ]);
    sheet1.getRow(1).font = { bold: true };

    // Sheet 2 — Doctor stats
    const sheet2 = workbook.addWorksheet(t.excel.sheet2);
    sheet2.columns = [
      { header: t.excel.firstName, key: 'firstName', width: 20 },
      { header: t.excel.lastName, key: 'lastName', width: 20 },
      { header: t.excel.appointmentsCol, key: 'total', width: 14 },
      { header: t.excel.completedCol, key: 'completed', width: 14 },
      { header: t.excel.revenueCol, key: 'revenue', width: 16 },
    ];
    const doctorStats = this.buildDoctorStats(data.appointments);
    doctorStats.forEach(g => {
      sheet2.addRow({ ...g, revenue: g.revenue.toFixed(2) });
    });
    sheet2.getRow(1).font = { bold: true };

    // Sheet 3 — All appointments
    const sheet3 = workbook.addWorksheet(t.excel.sheet3);
    sheet3.columns = [
      { header: t.excel.idx, key: 'idx', width: 6 },
      { header: t.excel.date, key: 'date', width: 12 },
      { header: t.excel.time, key: 'time', width: 10 },
      { header: t.excel.patientId, key: 'patientId', width: 14 },
      { header: t.excel.doctorId, key: 'doctorId', width: 14 },
      { header: t.excel.status, key: 'status', width: 16 },
      { header: t.excel.price, key: 'price', width: 14 },
    ];
    data.appointments.forEach((a, i) => {
      sheet3.addRow({
        idx: i + 1,
        date: a.date,
        time: a.time,
        patientId: a.patientId,
        doctorId: a.doctorId,
        status: t.statusLabels[a.status] || a.status,
        price: Number(a.price) || 0,
      });
    });
    sheet3.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report_${month}_${year}_${lang}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
