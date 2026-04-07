import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
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
    { value: 1, key: 'REPORTS.JAN' }, { value: 2, key: 'REPORTS.FEB' },
    { value: 3, key: 'REPORTS.MAR' }, { value: 4, key: 'REPORTS.APR' },
    { value: 5, key: 'REPORTS.MAY' }, { value: 6, key: 'REPORTS.JUN' },
    { value: 7, key: 'REPORTS.JUL' }, { value: 8, key: 'REPORTS.AUG' },
    { value: 9, key: 'REPORTS.SEP' }, { value: 10, key: 'REPORTS.OCT' },
    { value: 11, key: 'REPORTS.NOV' }, { value: 12, key: 'REPORTS.DEC' },
  ];

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  constructor(private api: ApiService, private cdr: ChangeDetectorRef, private translate: TranslateService) {}

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
    const key = this.months.find(m => m.value === this.selectedMonth)?.key || '';
    return key ? this.translate.instant(key) : '';
  }

  getStatusLabel(status: string): string {
    const keys: Record<string, string> = {
      scheduled: 'APPOINTMENTS.STATUS_SCHEDULED',
      completed: 'APPOINTMENTS.STATUS_COMPLETED',
      cancelled: 'APPOINTMENTS.STATUS_CANCELLED'
    };
    const key = keys[status];
    return key ? this.translate.instant(key) : status;
  }
}
