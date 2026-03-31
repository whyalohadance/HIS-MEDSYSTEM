import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../core/services/api.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-patient-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
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

  viewingResult: any = null;
  viewingFileUrl: SafeResourceUrl = '';
  viewingRawUrl = '';
  previewType: 'html' | 'pdf' | 'image' | 'loading' | '' = '';
  previewHtml = '';
  readonly today = new Date().toISOString().split('T')[0];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
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
    const map: Record<string, string> = { scheduled: 'Запланирован', completed: 'Завершён', cancelled: 'Отменён' };
    return map[status] || status;
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  openResultViewer(result: any): void {
    this.viewingResult = result;
    // fileUrl is stored as a full URL (http://localhost:3000/uploads/name.docx)
    this.viewingRawUrl = result.fileUrl || '';
    this.previewType = 'loading';
    this.previewHtml = '';
    this.viewingFileUrl = '';
    this.cdr.detectChanges();

    this.api.get<any>(`/results/${result.id}/preview`).subscribe({
      next: (res) => {
        if (res.type === 'html') {
          this.previewType = 'html';
          this.previewHtml = res.content || '';
        } else if (res.type === 'pdf') {
          this.previewType = 'pdf';
          this.viewingFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(res.url || this.viewingRawUrl);
        } else if (res.type === 'image') {
          this.previewType = 'image';
          this.viewingFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(res.url || this.viewingRawUrl);
        } else {
          this.previewType = '';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.previewType = '';
        this.cdr.detectChanges();
      }
    });
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
