import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';

interface ReportSummary {
  month: number;
  year: number;
  totalAppointments: number;
  completedAppointments: number;
  newPatients: number;
  totalRevenue: number;
  patients: any[];
  staff: any[];
  rooms: any[];
  appointments: any[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  summary: ReportSummary | null = null;
  isLoading = false;
  isDownloading = false;
  error: string | null = null;

  months = [
    { value: 1, label: 'Январь' }, { value: 2, label: 'Февраль' },
    { value: 3, label: 'Март' }, { value: 4, label: 'Апрель' },
    { value: 5, label: 'Май' }, { value: 6, label: 'Июнь' },
    { value: 7, label: 'Июль' }, { value: 8, label: 'Август' },
    { value: 9, label: 'Сентябрь' }, { value: 10, label: 'Октябрь' },
    { value: 11, label: 'Ноябрь' }, { value: 12, label: 'Декабрь' },
  ];

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoading = true;
    this.error = null;
    const month = Number(this.selectedMonth);
    const year = Number(this.selectedYear);
    this.api.get<any>(`/reports/summary?month=${month}&year=${year}`).subscribe({
      next: res => {
        this.summary = res.data || res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        const status = err?.status;
        if (status === 401) this.error = 'Сессия истекла. Войдите заново.';
        else if (status === 403) this.error = 'Нет прав доступа. Требуется роль администратора.';
        else this.error = 'Не удалось загрузить отчёт. Проверьте соединение с сервером.';
        this.cdr.detectChanges();
      }
    });
  }

  downloadPDF(): void {
    this.isDownloading = true;
    const token = localStorage.getItem('token');
    const url = `http://localhost:3000/api/reports/pdf?month=${this.selectedMonth}&year=${this.selectedYear}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `report_${this.getMonthName()}_${this.selectedYear}.pdf`;
        a.click();
        this.isDownloading = false;
        this.cdr.detectChanges();
      })
      .catch(() => { this.isDownloading = false; this.cdr.detectChanges(); });
  }

  downloadExcel(): void {
    this.isDownloading = true;
    const token = localStorage.getItem('token');
    const url = `http://localhost:3000/api/reports/excel?month=${this.selectedMonth}&year=${this.selectedYear}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `report_${this.getMonthName()}_${this.selectedYear}.xlsx`;
        a.click();
        this.isDownloading = false;
        this.cdr.detectChanges();
      })
      .catch(() => { this.isDownloading = false; this.cdr.detectChanges(); });
  }

  getMonthName(): string {
    return this.months.find(m => m.value === this.selectedMonth)?.label || '';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { scheduled: 'Запланирован', completed: 'Завершён', cancelled: 'Отменён' };
    return map[status] || status;
  }
}
