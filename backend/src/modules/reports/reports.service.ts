import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Patient } from '../patients/patient.entity';
import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';
import PDFDocument = require('pdfkit');
import * as ExcelJS from 'exceljs';
import * as path from 'path';

const FONT_PATH = path.join(__dirname, '../../../fonts/Arial.ttf');

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
    const endDate = `${year}-${String(month).padStart(2, '0')}-${endDay}`;

    const appointments = await this.appointmentsRepo.find({
      where: { date: Between(startDate, endDate) },
      relations: ['patient', 'doctor'],
      order: { date: 'ASC', time: 'ASC' }
    });

    const allPatients = await this.patientsRepo.find({ order: { createdAt: 'ASC' } });
    const newPatients = allPatients.filter(p => {
      const created = new Date(p.createdAt);
      return created.getMonth() + 1 === month && created.getFullYear() === year;
    });

    const staff = await this.usersRepo.find({ order: { createdAt: 'ASC' } });
    const rooms = await this.roomsRepo.find({ order: { name: 'ASC' } });

    const totalRevenue = appointments.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;

    return {
      month, year,
      appointments,
      patients: allPatients,
      staff,
      rooms,
      totalRevenue,
      totalAppointments: appointments.length,
      completedAppointments,
      newPatients: newPatients.length,
    };
  }

  async generatePDF(month: number, year: number): Promise<Buffer> {
    const data = await this.getReportData(month, year);
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Кириллица: регистрируем Roboto и устанавливаем как шрифт по умолчанию
      doc.registerFont('Roboto', FONT_PATH);
      doc.font('Roboto');

      // Заголовок
      doc.fontSize(20).text(`Отчёт за ${monthNames[month - 1]} ${year}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Сформирован: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
      doc.moveDown(2);

      // Сводка
      doc.fontSize(14).text('Сводка', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Всего приёмов: ${data.totalAppointments}`);
      doc.text(`Завершённых приёмов: ${data.completedAppointments}`);
      doc.text(`Новых пациентов: ${data.newPatients}`);
      doc.text(`Всего пациентов: ${data.patients.length}`);
      doc.text(`Сотрудников: ${data.staff.length}`);
      doc.text(`Кабинетов: ${data.rooms.length}`);
      doc.text(`Общая выручка: ${data.totalRevenue.toFixed(2)} MDL`);
      doc.moveDown(2);

      // Приёмы
      doc.fontSize(14).text('Приёмы за месяц', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9);

      data.appointments.forEach((a, i) => {
        const patientName = a.patient ? `${a.patient.lastName} ${a.patient.firstName}` : `#${a.patientId}`;
        const doctorName = a.doctor ? `${a.doctor.lastName} ${a.doctor.firstName}` : `#${a.doctorId}`;
        doc.text(`${i + 1}. ${a.date} ${a.time} | Пациент: ${patientName} | Врач: ${doctorName} | Статус: ${a.status} | Цена: ${a.price || 0} MDL`);
      });

      if (data.appointments.length === 0) doc.text('Приёмов за этот месяц нет.');
      doc.moveDown(2);

      // Персонал
      doc.fontSize(14).text('Персонал', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9);
      data.staff.forEach((s, i) => {
        doc.text(`${i + 1}. ${s.lastName} ${s.firstName} | ${s.role} | ${s.email}`);
      });
      doc.moveDown(2);

      // Кабинеты
      doc.fontSize(14).text('Кабинеты', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9);
      data.rooms.forEach((r, i) => {
        doc.text(`${i + 1}. ${r.name} | №${r.number} | Этаж: ${r.floor || '—'}`);
      });

      doc.end();
    });
  }

  async generateExcel(month: number, year: number): Promise<Buffer> {
    const data = await this.getReportData(month, year);
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MedSystem';
    workbook.created = new Date();

    // Лист 1 — Сводка
    const summarySheet = workbook.addWorksheet('Сводка');
    summarySheet.columns = [
      { header: 'Параметр', key: 'param', width: 30 },
      { header: 'Значение', key: 'value', width: 20 },
    ];
    summarySheet.addRows([
      { param: 'Месяц', value: `${monthNames[month - 1]} ${year}` },
      { param: 'Всего приёмов', value: data.totalAppointments },
      { param: 'Завершённых приёмов', value: data.completedAppointments },
      { param: 'Новых пациентов', value: data.newPatients },
      { param: 'Всего пациентов', value: data.patients.length },
      { param: 'Сотрудников', value: data.staff.length },
      { param: 'Кабинетов', value: data.rooms.length },
      { param: 'Общая выручка (MDL)', value: data.totalRevenue },
    ]);

    // Лист 2 — Приёмы
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

    // Лист 3 — Пациенты
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

    // Лист 4 — Персонал
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

    // Лист 5 — Кабинеты
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

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
