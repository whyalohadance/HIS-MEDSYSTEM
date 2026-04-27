import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DicomViewerComponent } from '../../shared/components/dicom-viewer/dicom-viewer.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { LanguageService } from '../../core/services/language.service';
import { map } from 'rxjs';

@Component({
  selector: 'app-dicom-viewer-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, DicomViewerComponent],
  templateUrl: './dicom-viewer-page.component.html',
  styleUrls: ['./dicom-viewer-page.component.scss']
})
export class DicomViewerPageComponent implements OnInit, OnDestroy {
  study: any = null;
  isEditing = false;
  editFindings = '';
  editConclusion = '';
  isSaving = false;

  showReportPanel = false;
  reportData = { findings: '', conclusion: '' };
  isSavingReport = false;
  isDownloadingReport = false;
  templates = [
    {
      title: 'Норма',
      findings: 'Структура исследуемой области без видимых патологий. Ткани однородной структуры.',
      conclusion: 'Патологических изменений не выявлено.'
    },
    {
      title: 'Воспаление',
      findings: 'Определяется отёк мягких тканей, усиление сосудистого рисунка.',
      conclusion: 'Признаки воспалительного процесса. Рекомендована консультация специалиста.'
    },
    {
      title: 'Образование',
      findings: 'Визуализируется объёмное образование с чёткими контурами размером ___мм.',
      conclusion: 'Объёмное образование. Требуется дополнительное обследование.'
    }
  ];

  hierarchy: any = null;
  seriesList: any[] = [];
  selectedSeries = 0;

  measurements: any[] = [];

  readonly typeLabels: Record<string, string> = {
    mri: 'МРТ', ct: 'КТ', xray: 'Рентген',
    ultrasound: 'УЗИ', pet: 'ПЭТ', mammography: 'Маммография'
  };

  readonly statusLabels: Record<string, string> = {
    pending: 'Ожидает', scheduled: 'Запланировано',
    in_progress: 'В процессе', completed: 'Завершено', cancelled: 'Отменено'
  };

  readonly priorityLabels: Record<string, string> = {
    routine: 'Плановый', urgent: 'Срочный', stat: 'Критический'
  };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private confirm: ConfirmService,
    public langService: LanguageService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  get isRadiologistOrAdmin(): boolean {
    return this.auth.isAdmin || this.auth.isRadiologist;
  }

  ngOnInit(): void {
    this.document.body.classList.add('dicom-fullscreen');

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.get<any>(`/studies/${id}`).pipe(map(r => r.data)).subscribe({
        next: study => {
          this.study = study;
          this.editFindings = study.findings || '';
          this.editConclusion = study.conclusion || '';
          this.reportData.findings = study.findings || '';
          this.reportData.conclusion = study.conclusion || '';
          this.cdr.detectChanges();
          this.loadHierarchy();
          this.loadMeasurements();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('dicom-fullscreen');
  }

  saveFindings(): void {
    if (!this.study || this.isSaving) return;
    this.isSaving = true;
    this.api.patch<any>(`/studies/${this.study.id}`, {
      findings: this.editFindings,
      conclusion: this.editConclusion,
      status: 'completed'
    }).pipe(map(r => r.data)).subscribe({
      next: updated => {
        this.study = updated;
        this.isEditing = false;
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; this.cdr.detectChanges(); }
    });
  }

  loadHierarchy(): void {
    if (!this.study?.id) return;
    this.api.get<any>(`/studies/${this.study.id}/hierarchy`).pipe(map(r => r.data)).subscribe({
      next: data => {
        this.hierarchy = data;
        this.seriesList = data.series || [];
        this.cdr.detectChanges();
      }
    });
  }

  selectSeries(index: number): void {
    this.selectedSeries = index;
  }

  loadMeasurements(): void {
    if (!this.study?.id) return;
    this.api.get<any>(`/studies/${this.study.id}/measurements`).subscribe({
      next: (res) => {
        this.measurements = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  deleteMeasurement(m: any, index: number): void {
    if (m.id) {
      this.api.delete(`/studies/measurements/${m.id}`).subscribe();
    }
    this.measurements.splice(index, 1);
  }

  toggleReportPanel(): void {
    this.showReportPanel = !this.showReportPanel;
  }

  applyTemplate(template: any): void {
    this.reportData.findings = template.findings;
    this.reportData.conclusion = template.conclusion;
  }

  async saveReport(): Promise<void> {
    if (!this.reportData.findings.trim() || !this.reportData.conclusion.trim()) {
      this.toast.error('Заполните findings и заключение');
      return;
    }

    if (this.study?.status === 'completed') {
      const confirmed = await this.confirm.confirm({
        title: 'Перезаписать заключение?',
        message: 'Это исследование уже имеет заключение. Хотите его обновить?',
        confirmText: 'Обновить',
        cancelText: 'Отмена'
      });
      if (!confirmed) return;
    }

    this.isSavingReport = true;
    this.cdr.detectChanges();

    this.api.post<any>(`/studies/${this.study.id}/report`, this.reportData).subscribe({
      next: (res) => {
        this.toast.success('Заключение сохранено');
        this.study = res.data;
        this.isSavingReport = false;
        this.showReportPanel = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Ошибка сохранения');
        this.isSavingReport = false;
        this.cdr.detectChanges();
      }
    });
  }

  isRadiologist(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'admin' || user.role === 'radiologist';
  }

  downloadReportPDF(): void {
    if (!this.study?.id) return;
    this.isDownloadingReport = true;
    this.cdr.detectChanges();

    const lang = this.langService.getCurrentLanguage() || 'ro';
    const token = localStorage.getItem('token');
    const apiUrl = 'http://localhost:3000/api';

    fetch(`${apiUrl}/studies/${this.study.id}/report-pdf?lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = this.document.createElement('a');
        a.href = url;
        a.download = `study_${this.study.studyId}.pdf`;
        this.document.body.appendChild(a);
        a.click();
        this.document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.isDownloadingReport = false;
        this.toast.success('PDF скачан');
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.isDownloadingReport = false;
        this.toast.error('Ошибка скачивания');
        this.cdr.detectChanges();
      });
  }

  getTypeLabel(type: string): string { return this.typeLabels[type] || type; }
  getStatusLabel(status: string): string { return this.statusLabels[status] || status; }
  getPriorityLabel(priority: string): string { return this.priorityLabels[priority] || priority; }
}
