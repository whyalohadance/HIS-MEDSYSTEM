import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-worklist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './worklist.component.html',
  styleUrls: ['./worklist.component.scss']
})
export class WorklistComponent implements OnInit {
  studies: any[] = [];
  patients: any[] = [];
  isLoading = true;
  showConclusionModal = false;
  selectedStudy: any = null;
  successMessage = '';

  conclusionForm = {
    findings: '',
    conclusion: ''
  };

  readonly studyTypes: Record<string, string> = {
    mri: 'STUDIES.TYPE_MRI',
    ct: 'STUDIES.TYPE_CT',
    xray: 'STUDIES.TYPE_XRAY',
    ultrasound: 'STUDIES.TYPE_ULTRASOUND',
    pet: 'STUDIES.TYPE_PET',
    mammography: 'STUDIES.TYPE_MAMMOGRAPHY'
  };

  readonly statusLabels: Record<string, string> = {
    pending: 'STUDIES.STATUS_PENDING',
    scheduled: 'STUDIES.STATUS_SCHEDULED',
    in_progress: 'STUDIES.STATUS_IN_PROGRESS',
    completed: 'STUDIES.STATUS_COMPLETED',
    cancelled: 'STUDIES.STATUS_CANCELLED'
  };

  readonly priorityOrder: Record<string, number> = { stat: 0, urgent: 1, routine: 2 };

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.api.get<any>('/studies/worklist').pipe(map(r => r.data)).subscribe({
      next: studies => {
        this.studies = this.sortStudies(studies);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });

    this.api.get<any>('/patients').pipe(map(r => r.data)).subscribe({
      next: p => { this.patients = p; this.cdr.detectChanges(); }
    });
  }

  sortStudies(studies: any[]): any[] {
    return studies.sort((a, b) => {
      const prioDiff = (this.priorityOrder[a.priority] ?? 3) - (this.priorityOrder[b.priority] ?? 3);
      if (prioDiff !== 0) return prioDiff;
      const dateA = a.scheduledAt || a.createdAt || '';
      const dateB = b.scheduledAt || b.createdAt || '';
      return dateA.localeCompare(dateB);
    });
  }

  getPatientName(id: number): string {
    const p = this.patients.find(p => p.id === id);
    return p ? `${p.lastName} ${p.firstName}` : `#${id}`;
  }

  getTypeLabel(type: string): string {
    return this.translate.instant(this.studyTypes[type] || type);
  }

  getStatusLabel(status: string): string {
    return this.translate.instant(this.statusLabels[status] || status);
  }

  start(study: any): void {
    this.updateStatus(study, 'in_progress');
  }

  cancel(study: any): void {
    this.updateStatus(study, 'cancelled');
  }

  complete(study: any): void {
    this.selectedStudy = study;
    this.conclusionForm = { findings: study.findings || '', conclusion: study.conclusion || '' };
    this.showConclusionModal = true;
  }

  updateStatus(study: any, status: string): void {
    this.api.patch<any>(`/studies/${study.id}`, { status }).pipe(map(r => r.data)).subscribe({
      next: updated => {
        if (status === 'cancelled' || status === 'completed') {
          this.studies = this.studies.filter(s => s.id !== updated.id);
        } else {
          const idx = this.studies.findIndex(s => s.id === updated.id);
          if (idx >= 0) this.studies[idx] = updated;
        }
        this.cdr.detectChanges();
      }
    });
  }

  closeConclusionModal(): void {
    this.showConclusionModal = false;
    this.selectedStudy = null;
  }

  submitConclusion(): void {
    if (!this.selectedStudy) return;
    const dto = {
      findings: this.conclusionForm.findings,
      conclusion: this.conclusionForm.conclusion,
      status: 'completed'
    };
    this.api.patch<any>(`/studies/${this.selectedStudy.id}`, dto).pipe(map(r => r.data)).subscribe({
      next: () => {
        this.studies = this.studies.filter(s => s.id !== this.selectedStudy!.id);
        this.closeConclusionModal();
        this.showSuccess('COMMON.SAVED');
        this.cdr.detectChanges();
      }
    });
  }

  private showSuccess(key: string): void {
    this.successMessage = this.translate.instant(key);
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
  }
}
