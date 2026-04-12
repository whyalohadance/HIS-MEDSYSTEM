import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { map } from 'rxjs';

interface Study {
  id: number;
  studyId: string;
  patientId: number;
  type: string;
  status: string;
  priority: string;
  bodyPart: string;
  description: string;
  clinicalInfo: string;
  findings: string;
  conclusion: string;
  modalityId: number;
  scheduledAt: string;
  scheduledTime: string;
  completedAt: string;
  price: number;
  createdAt: string;
}

@Component({
  selector: 'app-studies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './studies.component.html',
  styleUrls: ['./studies.component.scss']
})
export class StudiesComponent implements OnInit {
  studies: Study[] = [];
  filteredStudies: Study[] = [];
  modalities: any[] = [];
  patients: any[] = [];
  isLoading = true;
  showForm = false;
  showConclusionModal = false;
  selectedStudy: Study | null = null;
  successMessage = '';

  filterType = '';
  filterStatus = '';
  filterPriority = '';

  form = {
    patientId: null as number | null,
    type: '',
    priority: 'routine',
    bodyPart: '',
    description: '',
    clinicalInfo: '',
    modalityId: null as number | null,
    scheduledAt: '',
    scheduledTime: '',
    price: null as number | null
  };

  conclusionForm = {
    findings: '',
    conclusion: ''
  };

  readonly studyTypes = [
    { value: 'mri', labelKey: 'STUDIES.TYPE_MRI' },
    { value: 'ct', labelKey: 'STUDIES.TYPE_CT' },
    { value: 'xray', labelKey: 'STUDIES.TYPE_XRAY' },
    { value: 'ultrasound', labelKey: 'STUDIES.TYPE_ULTRASOUND' },
    { value: 'pet', labelKey: 'STUDIES.TYPE_PET' },
    { value: 'mammography', labelKey: 'STUDIES.TYPE_MAMMOGRAPHY' }
  ];

  readonly studyStatuses = [
    { value: 'pending', labelKey: 'STUDIES.STATUS_PENDING' },
    { value: 'scheduled', labelKey: 'STUDIES.STATUS_SCHEDULED' },
    { value: 'in_progress', labelKey: 'STUDIES.STATUS_IN_PROGRESS' },
    { value: 'completed', labelKey: 'STUDIES.STATUS_COMPLETED' },
    { value: 'cancelled', labelKey: 'STUDIES.STATUS_CANCELLED' }
  ];

  readonly priorities = [
    { value: 'routine', labelKey: 'STUDIES.PRIORITY_ROUTINE' },
    { value: 'urgent', labelKey: 'STUDIES.PRIORITY_URGENT' },
    { value: 'stat', labelKey: 'STUDIES.PRIORITY_STAT' }
  ];

  constructor(
    private api: ApiService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.api.get<any>('/studies').pipe(map(r => r.data)).subscribe({
      next: studies => {
        this.studies = studies;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });

    this.api.get<any>('/studies/modalities/all').pipe(map(r => r.data)).subscribe({
      next: m => { this.modalities = m; this.cdr.detectChanges(); }
    });

    this.api.get<any>('/patients').pipe(map(r => r.data)).subscribe({
      next: p => { this.patients = p; this.cdr.detectChanges(); }
    });
  }

  applyFilters(): void {
    this.filteredStudies = this.studies.filter(s => {
      if (this.filterType && s.type !== this.filterType) return false;
      if (this.filterStatus && s.status !== this.filterStatus) return false;
      if (this.filterPriority && s.priority !== this.filterPriority) return false;
      return true;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterType = '';
    this.filterStatus = '';
    this.filterPriority = '';
    this.applyFilters();
  }

  getPatientName(id: number): string {
    const p = this.patients.find(p => p.id === id);
    return p ? `${p.lastName} ${p.firstName}` : `#${id}`;
  }

  getTypeLabel(type: string): string {
    const t = this.studyTypes.find(t => t.value === type);
    return t ? this.translate.instant(t.labelKey) : type;
  }

  getStatusLabel(status: string): string {
    const s = this.studyStatuses.find(s => s.value === status);
    return s ? this.translate.instant(s.labelKey) : status;
  }

  getPriorityLabel(priority: string): string {
    const p = this.priorities.find(p => p.value === priority);
    return p ? this.translate.instant(p.labelKey) : priority;
  }

  openForm(): void {
    this.showForm = true;
    this.form = {
      patientId: null,
      type: '',
      priority: 'routine',
      bodyPart: '',
      description: '',
      clinicalInfo: '',
      modalityId: null,
      scheduledAt: '',
      scheduledTime: '',
      price: null
    };
  }

  closeForm(): void {
    this.showForm = false;
  }

  submitForm(): void {
    if (!this.form.patientId || !this.form.type) return;
    const body: any = { ...this.form };
    if (!body.modalityId) delete body.modalityId;
    if (!body.price) delete body.price;

    this.api.post<any>('/studies', body).pipe(map(r => r.data)).subscribe({
      next: study => {
        this.studies.unshift(study);
        this.applyFilters();
        this.showForm = false;
        this.showSuccess('COMMON.SAVED');
        this.cdr.detectChanges();
      }
    });
  }

  openConclusionModal(study: Study): void {
    this.selectedStudy = study;
    this.conclusionForm = {
      findings: study.findings || '',
      conclusion: study.conclusion || ''
    };
    this.showConclusionModal = true;
  }

  closeConclusionModal(): void {
    this.showConclusionModal = false;
    this.selectedStudy = null;
  }

  submitConclusion(): void {
    if (!this.selectedStudy) return;
    const dto: any = {
      findings: this.conclusionForm.findings,
      conclusion: this.conclusionForm.conclusion,
      status: 'completed'
    };
    this.api.patch<any>(`/studies/${this.selectedStudy.id}`, dto).pipe(map(r => r.data)).subscribe({
      next: updated => {
        const idx = this.studies.findIndex(s => s.id === updated.id);
        if (idx >= 0) this.studies[idx] = updated;
        this.applyFilters();
        this.closeConclusionModal();
        this.showSuccess('COMMON.SAVED');
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(study: Study, status: string): void {
    this.api.patch<any>(`/studies/${study.id}`, { status }).pipe(map(r => r.data)).subscribe({
      next: updated => {
        const idx = this.studies.findIndex(s => s.id === updated.id);
        if (idx >= 0) this.studies[idx] = updated;
        this.applyFilters();
        this.cdr.detectChanges();
      }
    });
  }

  private showSuccess(key: string): void {
    this.successMessage = this.translate.instant(key);
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
  }
}
