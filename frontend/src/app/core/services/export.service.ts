import { Injectable } from '@angular/core';
import { Patient } from '../models/patient.model';
import { Appointment } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class ExportService {

  async exportPatientsPDF(patients: Patient[]): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Список пациентов', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Фамилия Имя', 'Дата рождения', 'Пол', 'Телефон', 'Email']],
      body: patients.map(p => [
        p.id,
        `${p.lastName} ${p.firstName}`,
        p.dateOfBirth,
        p.gender === 'male' ? 'Мужской' : 'Женский',
        p.phone,
        p.email
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [26, 115, 232] },
    });

    doc.save(`patients_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  async exportAppointmentsPDF(appointments: Appointment[]): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Список приёмов', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 14, 28);

    const statusMap: Record<string, string> = {
      scheduled: 'Запланирован',
      completed: 'Завершён',
      cancelled: 'Отменён'
    };

    autoTable(doc, {
      startY: 35,
      head: [['#', 'Пациент', 'Дата', 'Время', 'Статус', 'Заметки']],
      body: appointments.map(a => [
        a.id,
        `Пациент #${a.patientId}`,
        a.date,
        a.time,
        statusMap[a.status] || a.status,
        a.notes || '—'
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [26, 115, 232] },
    });

    doc.save(`appointments_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  exportPatientsCSV(patients: Patient[]): void {
    const headers = ['ID', 'Фамилия', 'Имя', 'Дата рождения', 'Пол', 'Телефон', 'Email'];
    const rows = patients.map(p => [
      p.id, p.lastName, p.firstName, p.dateOfBirth,
      p.gender === 'male' ? 'Мужской' : 'Женский',
      p.phone, p.email
    ]);
    this.downloadCSV(headers, rows, `patients_${new Date().toISOString().split('T')[0]}.csv`);
  }

  exportAppointmentsCSV(appointments: Appointment[]): void {
    const statusMap: Record<string, string> = {
      scheduled: 'Запланирован',
      completed: 'Завершён',
      cancelled: 'Отменён'
    };
    const headers = ['ID', 'Пациент', 'Дата', 'Время', 'Статус', 'Заметки'];
    const rows = appointments.map(a => [
      a.id, `Пациент #${a.patientId}`, a.date, a.time,
      statusMap[a.status] || a.status, a.notes || ''
    ]);
    this.downloadCSV(headers, rows, `appointments_${new Date().toISOString().split('T')[0]}.csv`);
  }

  private downloadCSV(headers: any[], rows: any[], filename: string): void {
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map((v: any) => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
