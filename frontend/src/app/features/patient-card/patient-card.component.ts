import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
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
export class PatientCardComponent implements OnInit {
  patient: any = null;
  appointments: any[] = [];
  results: any[] = [];
  doctors: any[] = [];
  isLoading = true;
  patientId = 0;

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
    private translate: TranslateService
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
