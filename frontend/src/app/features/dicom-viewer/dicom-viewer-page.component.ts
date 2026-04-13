import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DicomViewerComponent } from '../../shared/components/dicom-viewer/dicom-viewer.component';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
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
          this.cdr.detectChanges();
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

  getTypeLabel(type: string): string { return this.typeLabels[type] || type; }
  getStatusLabel(status: string): string { return this.statusLabels[status] || status; }
  getPriorityLabel(priority: string): string { return this.priorityLabels[priority] || priority; }
}
