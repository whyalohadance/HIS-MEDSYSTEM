import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { CommonModule, registerLocaleData } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { LanguageService } from '../../core/services/language.service';
import { map } from 'rxjs';
import localeRo from '@angular/common/locales/ro';
import localeRu from '@angular/common/locales/ru';
import localeEn from '@angular/common/locales/en';

registerLocaleData(localeRo, 'ro');
registerLocaleData(localeRu, 'ru');
registerLocaleData(localeEn, 'en');

@Component({
  selector: 'app-patient-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './patient-card.component.html',
  styleUrls: ['./patient-card.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PatientCardComponent implements OnInit, OnDestroy {
  patient: any = null;
  appointments: any[] = [];
  results: any[] = [];
  studies: any[] = [];
  doctors: any[] = [];
  isLoading = true;
  patientId = 0;

  activeTab: 'info' | 'appointments' | 'lab' | 'studies' | 'dynamics' = 'info';
  labOrders: any[] = [];
  labResults: { [orderId: number]: any[] } = {};
  isLoadingLab = false;
  tests: any[] = [];
  isLoadingStudies = false;
  modalitiesList: any[] = [];
  parameterHistory: any[] = [];
  selectedParameter: any = null;
  isLoadingHistory = false;
  chartInstance: any = null;

  currentLocale = 'ru';

  viewingResult: any = null;
  viewingFileUrl: SafeResourceUrl = '';
  viewingRawUrl = '';
  previewType: 'html' | 'pdf' | 'image' | 'loading' | 'unsupported' | '' = '';
  previewHtml = '';
  readonly today = new Date().toISOString().split('T')[0];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    public langService: LanguageService
  ) {
    this.translate.onLangChange.subscribe(event => {
      this.currentLocale = event.lang;
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    this.currentLocale = this.translate.currentLang || localStorage.getItem('language') || 'ru';
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAll();
    this.loadModalities();
  }

  loadAll(): void {
    this.api.get<any>('/users/doctors').pipe(map(r => r.data)).subscribe({
      next: doctors => { this.doctors = doctors; }
    });

    this.api.get<any>('/patients').pipe(map(r => r.data)).subscribe({
      next: patients => {
        this.patient = patients.find((p: any) => p.id === this.patientId);
        this.cdr.detectChanges();
      }
    });

    this.api.get<any>('/appointments').pipe(map(r => r.data)).subscribe({
      next: apts => {
        this.appointments = apts
          .filter((a: any) => a.patientId === this.patientId)
          .sort((a: any, b: any) => b.date.localeCompare(a.date));
        this.cdr.detectChanges();
      }
    });

    this.api.get<any>('/results').pipe(map(r => r.data)).subscribe({
      next: results => {
        this.results = results.filter((r: any) => r.patientId === this.patientId);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });

  }

  get patientCode(): string {
    return String(this.patientId).padStart(6, '0');
  }

  get age(): number {
    if (!this.patient?.dateOfBirth) return 0;
    return Math.floor((Date.now() - new Date(this.patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }

  get initials(): string {
    if (!this.patient) return '?';
    return `${this.patient.firstName?.[0] || ''}${this.patient.lastName?.[0] || ''}`;
  }

  getDoctorName(id: number): string {
    const d = this.doctors.find(d => d.id === id);
    return d ? `${d.lastName} ${d.firstName}` : `Врач #${id}`;
  }

  getStudyStatusLabel(status: string): string {
    const map: any = {
      pending: 'Ожидает', in_progress: 'В процессе',
      completed: 'Завершено', cancelled: 'Отменено', scheduled: 'Запланировано'
    };
    return map[status] || status;
  }

  getStudyStatusColor(status: string): string {
    const map: any = {
      pending: '#f59e0b', in_progress: '#3b82f6',
      completed: '#10b981', cancelled: '#ef4444', scheduled: '#8b5cf6'
    };
    return map[status] || '#94a3b8';
  }

  getModalityIcon(type: string): string {
    const map: any = {
      mri: 'view_in_ar', ct: 'panorama_horizontal',
      xray: 'broken_image', ultrasound: 'graphic_eq', mammography: 'visibility'
    };
    return map[type] || 'biotech';
  }

  getModalityLabel(type: string): string {
    const map: any = {
      mri: 'МРТ', ct: 'КТ', xray: 'Рентген',
      ultrasound: 'УЗИ', mammography: 'Маммография'
    };
    return map[type] || type;
  }

  getModalityColor(type: string): string {
    const map: any = {
      mri: '#7c3aed', ct: '#3b82f6', xray: '#10b981',
      ultrasound: '#f59e0b', mammography: '#ec4899'
    };
    return map[type] || '#94a3b8';
  }

  getCompletedStudiesCount(): number {
    return this.studies.filter(s => s.status === 'completed').length;
  }

  getPendingStudiesCount(): number {
    return this.studies.filter(s => s.status === 'pending' || s.status === 'in_progress').length;
  }

  openStudy(studyId: number): void {
    this.router.navigate(['/dicom', studyId]);
  }

  loadStudiesHistory(): void {
    if (!this.patient?.id) return;
    this.isLoadingStudies = true;
    this.cdr.detectChanges();
    this.api.get<any>(`/studies?patientId=${this.patient.id}`).subscribe({
      next: (res) => {
        this.studies = res.data || [];
        this.isLoadingStudies = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingStudies = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadModalities(): void {
    this.api.get<any>('/studies/modalities').subscribe({
      next: (res) => { this.modalitiesList = res.data || []; this.cdr.detectChanges(); },
      error: () => {}
    });
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

  formatDate(date: string): string {
    if (!date) return '';
    const localeMap: Record<string, string> = { ru: 'ru-RU', ro: 'ro-RO', en: 'en-US' };
    const locale = localeMap[this.currentLocale] || 'ru-RU';
    return new Date(date).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  }

  openResultViewer(result: any): void {
    const url = result.fileUrl?.startsWith('http')
      ? result.fileUrl
      : `http://localhost:3000${result.fileUrl}`;

    this.viewingResult = result;
    this.viewingRawUrl = url;

    if (this.isPDF(result)) {
      this.viewingFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.previewType = 'pdf';
      this.cdr.detectChanges();
    } else if (this.isImage(result)) {
      this.viewingFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.previewType = 'image';
      this.cdr.detectChanges();
    } else if (this.isOffice(result)) {
      this.previewType = 'loading';
      this.cdr.detectChanges();
      this.api.get<any>(`/results/${result.id}/preview`).subscribe({
        next: (res) => {
          const data = res.data || res;
          if (data.type === 'html' && data.content) {
            this.previewHtml = data.content;
            this.previewType = 'html';
          } else {
            this.previewType = 'unsupported';
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.previewType = 'unsupported';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.previewType = 'unsupported';
      this.cdr.detectChanges();
    }
  }

  closeResultViewer(): void {
    this.viewingResult = null;
    this.viewingFileUrl = '';
    this.viewingRawUrl = '';
    this.previewType = '';
    this.previewHtml = '';
    this.cdr.detectChanges();
  }

  downloadResultPDF(result: any): void {
    const url = result.fileUrl?.startsWith('http')
      ? result.fileUrl
      : `http://localhost:3000${result.fileUrl}`;
    window.open(url, '_blank');
  }

  printResult(): void {
    if (this.previewType === 'html') {
      const el = document.querySelector('.html-preview') as HTMLElement;
      if (el) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(`<html><body>${el.innerHTML}</body></html>`);
          win.document.close();
          win.print();
        }
      }
    } else {
      window.open(this.viewingRawUrl, '_blank');
    }
  }

  private getFilename(result: any): string {
    return result?.fileName || result?.fileUrl?.split('/').pop() || '';
  }

  isImage(result: any): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(this.getFilename(result));
  }

  isPDF(result: any): boolean {
    return /\.pdf$/i.test(this.getFilename(result));
  }

  isOffice(result: any): boolean {
    return /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(this.getFilename(result));
  }

  canPreview(result: any): boolean {
    return this.isPDF(result) || this.isImage(result) || this.isOffice(result);
  }

  setTab(tab: string): void {
    this.activeTab = tab as any;
    if (tab === 'lab' && this.labOrders.length === 0 && !this.isLoadingLab) {
      this.loadLabHistory();
    }
    if (tab === 'studies' && this.studies.length === 0 && !this.isLoadingStudies) {
      this.loadStudiesHistory();
    }
    if (tab === 'dynamics' && this.parameterHistory.length === 0 && !this.isLoadingHistory) {
      this.loadParameterHistory();
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  loadParameterHistory(): void {
    if (!this.patient?.id) return;
    this.isLoadingHistory = true;
    this.cdr.detectChanges();
    this.api.get<any>(`/lab/patient/${this.patient.id}/history`).subscribe({
      next: (res) => {
        this.parameterHistory = res.data?.parameters || [];
        if (this.parameterHistory.length > 0) {
          this.selectParameter(this.parameterHistory[0]);
        }
        this.isLoadingHistory = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingHistory = false; this.cdr.detectChanges(); }
    });
  }

  selectParameter(param: any): void {
    this.selectedParameter = param;
    this.cdr.detectChanges();
    setTimeout(() => this.renderChart(), 100);
  }

  renderChart(): void {
    if (!this.selectedParameter) return;
    const canvas = document.getElementById('paramChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const points = this.selectedParameter.points;
    const labels = points.map((p: any) => {
      const d = new Date(p.date);
      return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
    });
    const values = points.map((p: any) => p.value);
    const colors = points.map((p: any) => {
      if (p.flag === 'critical_low' || p.flag === 'critical_high') return '#dc2626';
      if (p.flag === 'low' || p.flag === 'high') return '#f59e0b';
      return '#10b981';
    });

    const minRange = this.selectedParameter.minRange;
    const maxRange = this.selectedParameter.maxRange;

    const datasets: any[] = [
      {
        label: this.selectedParameter.name,
        data: values,
        borderColor: '#1a73e8',
        backgroundColor: 'rgba(26, 115, 232, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        pointBackgroundColor: colors,
        pointBorderColor: colors,
        pointRadius: 6,
        pointHoverRadius: 9,
        fill: true
      }
    ];

    if (minRange !== null && maxRange !== null) {
      datasets.push({
        label: 'Норма (мин)',
        data: new Array(values.length).fill(minRange),
        borderColor: 'rgba(16, 185, 129, 0.4)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0
      });
      datasets.push({
        label: 'Норма (макс)',
        data: new Array(values.length).fill(maxRange),
        borderColor: 'rgba(16, 185, 129, 0.4)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: '-1',
        backgroundColor: 'rgba(16, 185, 129, 0.06)',
        tension: 0
      });
    }

    const self = this;
    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, padding: 15, font: { size: 12, family: 'inherit' } }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 45, 82, 0.95)',
            padding: 12,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            callbacks: {
              label: (ctx: any) => {
                if (ctx.datasetIndex !== 0) return '';
                const p = points[ctx.dataIndex];
                const status = p.flag === 'normal' ? '✓ норма' :
                               p.flag === 'low' ? '⬇ ниже нормы' :
                               p.flag === 'high' ? '⬆ выше нормы' :
                               p.flag === 'critical_low' ? '⬇⬇ критично' :
                               p.flag === 'critical_high' ? '⬆⬆ критично' : '';
                return `${p.value} ${self.selectedParameter.unit || ''} (${status})`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { size: 11 }, color: '#64748b' },
            title: {
              display: true,
              text: this.selectedParameter.unit || 'Значение',
              color: '#64748b',
              font: { size: 11 }
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: '#94a3b8', maxRotation: 45, minRotation: 0 }
          }
        }
      }
    });
  }

  getTrend(param: any): { trend: 'up' | 'down' | 'stable'; diff: number; percent: number } {
    if (!param?.points || param.points.length < 2) return { trend: 'stable', diff: 0, percent: 0 };
    const first = param.points[0].value;
    const last = param.points[param.points.length - 1].value;
    const diff = last - first;
    const percent = first !== 0 ? (diff / first) * 100 : 0;
    if (Math.abs(percent) < 5) return { trend: 'stable', diff, percent };
    return { trend: percent > 0 ? 'up' : 'down', diff, percent };
  }

  getAbnormalCount(param: any): number {
    return (param?.points || []).filter((p: any) => p.flag !== 'normal').length;
  }

  getLatestValue(param: any): any {
    if (!param?.points || param.points.length === 0) return null;
    return param.points[param.points.length - 1];
  }

  loadLabHistory(): void {
    if (!this.patient?.id) return;
    this.isLoadingLab = true;
    this.api.get<any>(`/lab/patient/${this.patient.id}`).subscribe({
      next: (res) => {
        this.labOrders = res.data || [];
        this.isLoadingLab = false;
        this.cdr.detectChanges();
        this.labOrders.forEach(order => {
          if (order.status === 'completed') {
            this.api.get<any>(`/lab/orders/${order.id}/results`).subscribe({
              next: (r) => {
                this.labResults[order.id] = r.data || [];
                this.cdr.detectChanges();
              },
              error: () => {}
            });
          }
        });
        if (this.tests.length === 0) this.loadTestsCatalog();
      },
      error: () => { this.isLoadingLab = false; this.cdr.detectChanges(); }
    });
  }

  loadTestsCatalog(): void {
    this.api.get<any>('/lab/tests').subscribe({
      next: (res) => { this.tests = res.data || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  getLabStatusColor(status: string): string {
    const map: Record<string, string> = {
      pending: 'status-pending', in_progress: 'status-progress',
      completed: 'status-completed', cancelled: 'status-cancelled'
    };
    return map[status] || 'status-pending';
  }

  getLabStatusLabel(status: string): string {
    const keys: Record<string, string> = {
      pending: 'LAB.STATUS_PENDING', in_progress: 'LAB.STATUS_IN_PROGRESS',
      completed: 'LAB.STATUS_COMPLETED', cancelled: 'LAB.STATUS_CANCELLED'
    };
    const key = keys[status];
    return key ? this.translate.instant(key) : status;
  }

  getFlagClass(flag: string): string {
    const map: Record<string, string> = {
      normal: 'flag-normal', low: 'flag-low', high: 'flag-high',
      critical_low: 'flag-critical', critical_high: 'flag-critical'
    };
    return map[flag] || 'flag-normal';
  }

  getFlagLabel(flag: string): string {
    const map: Record<string, string> = {
      normal: 'N', low: 'L', high: 'H', critical_low: 'CL', critical_high: 'CH'
    };
    return map[flag] || flag;
  }

  countAbnormal(orderId: number): number {
    const results = this.labResults[orderId] || [];
    return results.filter(r => r.flag && r.flag !== 'normal').length;
  }

  getTestNameForOrder(testId: number): string {
    const t = this.tests.find(t => t.id === testId);
    return t ? (t.name || t.testName || `Test #${testId}`) : `Test #${testId}`;
  }

  getCompletedCount(): number {
    return this.labOrders.filter(o => o.status === 'completed').length;
  }

  getPendingCount(): number {
    return this.labOrders.filter(o => o.status === 'pending' || o.status === 'in_progress').length;
  }

  goToOrder(orderId: number): void {
    this.router.navigate(['/lab/order', orderId]);
  }

  downloadStudyPDF(study: any): void {
    const lang = this.langService.getCurrentLanguage() || 'ro';
    const token = localStorage.getItem('token');
    const apiUrl = 'http://localhost:3000/api';

    fetch(`${apiUrl}/studies/${study.id}/report-pdf?lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `study_${study.studyId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  }

  printCard(): void {
    window.print();
  }

  bookAppointment(): void {
    this.router.navigate(['/appointments'], {
      state: { patientId: this.patient.id, patientName: `${this.patient.lastName} ${this.patient.firstName}` }
    });
  }

  goBack(): void {
    this.router.navigate(['/patients']);
  }

  get completedAppointments(): number {
    return this.appointments.filter(a => a.status === 'completed').length;
  }

  get totalSpent(): number {
    return this.appointments.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  }
}
