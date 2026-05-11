import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { LanguageService } from '../../core/services/language.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  summary: ReportSummary | null = null;
  isLoading = false;
  isDownloading = false;
  error: string | null = null;

  monthlyStats: any = null;
  yearlyStats: any = null;
  isStatsLoading = false;

  @ViewChild('dailyChart') dailyChartRef!: ElementRef;
  @ViewChild('statusChart') statusChartRef!: ElementRef;
  @ViewChild('servicesChart') servicesChartRef!: ElementRef;
  @ViewChild('yearlyChart') yearlyChartRef!: ElementRef;

  private charts: Chart<any>[] = [];

  months = [
    { value: 1, key: 'REPORTS.JAN' }, { value: 2, key: 'REPORTS.FEB' },
    { value: 3, key: 'REPORTS.MAR' }, { value: 4, key: 'REPORTS.APR' },
    { value: 5, key: 'REPORTS.MAY' }, { value: 6, key: 'REPORTS.JUN' },
    { value: 7, key: 'REPORTS.JUL' }, { value: 8, key: 'REPORTS.AUG' },
    { value: 9, key: 'REPORTS.SEP' }, { value: 10, key: 'REPORTS.OCT' },
    { value: 11, key: 'REPORTS.NOV' }, { value: 12, key: 'REPORTS.DEC' },
  ];

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    public langService: LanguageService,
  ) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
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
        this.loadStats();
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

  loadStats(): void {
    this.isStatsLoading = true;
    const month = Number(this.selectedMonth);
    const year = Number(this.selectedYear);

    Promise.all([
      this.api.get<any>(`/reports/stats?year=${year}&month=${month}`).toPromise(),
      this.api.get<any>(`/reports/yearly-stats?year=${year}`).toPromise(),
    ]).then(([monthlyRes, yearlyRes]) => {
      this.monthlyStats = monthlyRes?.data ?? monthlyRes;
      this.yearlyStats = yearlyRes?.data ?? yearlyRes;
      this.isStatsLoading = false;
      this.cdr.detectChanges();
      setTimeout(() => this.renderCharts(), 100);
    }).catch(() => {
      this.isStatsLoading = false;
      this.cdr.detectChanges();
    });
  }

  private renderCharts(): void {
    this.destroyCharts();
    this.renderDailyChart();
    this.renderStatusChart();
    this.renderServicesChart();
    this.renderYearlyChart();
  }

  private renderDailyChart(): void {
    const el = this.dailyChartRef?.nativeElement;
    if (!el || !this.monthlyStats?.daily) return;
    const chart = new Chart(el, {
      type: 'line',
      data: {
        labels: this.monthlyStats.daily.map((d: any) => d.day),
        datasets: [
          { label: 'Приёмы', data: this.monthlyStats.daily.map((d: any) => d.appointments), borderColor: '#1a73e8', backgroundColor: 'rgba(26,115,232,0.08)', tension: 0.4, fill: true },
          { label: 'Анализы', data: this.monthlyStats.daily.map((d: any) => d.labOrders), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', tension: 0.4, fill: true },
          { label: 'Исследования', data: this.monthlyStats.daily.map((d: any) => d.studies), borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.08)', tension: 0.4, fill: true },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    });
    this.charts.push(chart);
  }

  private renderStatusChart(): void {
    const el = this.statusChartRef?.nativeElement;
    if (!el || !this.monthlyStats?.statusBreakdown?.length) return;
    const labels: Record<string, string> = { scheduled: 'Запланированы', in_progress: 'В процессе', completed: 'Завершены', cancelled: 'Отменены' };
    const colors: Record<string, string> = { scheduled: '#fbbf24', in_progress: '#3b82f6', completed: '#10b981', cancelled: '#ef4444' };
    const chart = new Chart(el, {
      type: 'doughnut',
      data: {
        labels: this.monthlyStats.statusBreakdown.map((s: any) => labels[s.status] ?? s.status),
        datasets: [{ data: this.monthlyStats.statusBreakdown.map((s: any) => +s.count), backgroundColor: this.monthlyStats.statusBreakdown.map((s: any) => colors[s.status] ?? '#94a3b8'), borderWidth: 0 }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
    });
    this.charts.push(chart);
  }

  private renderServicesChart(): void {
    const el = this.servicesChartRef?.nativeElement;
    if (!el || !this.monthlyStats?.topServices?.length) return;
    const chart = new Chart(el, {
      type: 'bar',
      data: {
        labels: this.monthlyStats.topServices.map((s: any) => s.name),
        datasets: [{ label: 'Количество', data: this.monthlyStats.topServices.map((s: any) => +s.count), backgroundColor: '#1a73e8', borderRadius: 6 }],
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } },
    });
    this.charts.push(chart);
  }

  private renderYearlyChart(): void {
    const el = this.yearlyChartRef?.nativeElement;
    if (!el || !this.yearlyStats?.months) return;
    const chart = new Chart(el, {
      type: 'bar',
      data: {
        labels: this.yearlyStats.months.map((m: any) => m.monthName),
        datasets: [
          { label: 'Приёмы', data: this.yearlyStats.months.map((m: any) => m.appointments), backgroundColor: '#1a73e8', borderRadius: 4 },
          { label: 'Анализы', data: this.yearlyStats.months.map((m: any) => m.labOrders), backgroundColor: '#10b981', borderRadius: 4 },
          { label: 'Исследования', data: this.yearlyStats.months.map((m: any) => m.studies), backgroundColor: '#7c3aed', borderRadius: 4 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    });
    this.charts.push(chart);
  }

  downloadPDF(): void {
    this.isDownloading = true;
    const token = localStorage.getItem('token');
    const lang = this.langService.getCurrentLanguage() || 'ro';
    const url = `http://localhost:3000/api/reports/pdf?month=${this.selectedMonth}&year=${this.selectedYear}&lang=${lang}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `report_${this.getMonthName()}_${this.selectedYear}_${lang}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        this.isDownloading = false;
        this.cdr.detectChanges();
      })
      .catch(() => { this.isDownloading = false; this.cdr.detectChanges(); });
  }

  downloadExcel(): void {
    this.isDownloading = true;
    const token = localStorage.getItem('token');
    const lang = this.langService.getCurrentLanguage() || 'ro';
    const url = `http://localhost:3000/api/reports/excel?month=${this.selectedMonth}&year=${this.selectedYear}&lang=${lang}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const xlsxBlob = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const objectUrl = URL.createObjectURL(xlsxBlob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `report_${this.getMonthName()}_${this.selectedYear}_${lang}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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
