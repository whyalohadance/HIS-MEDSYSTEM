import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';
import { ResultsService, Result } from '../../core/services/results.service';
import { PatientsService } from '../../core/services/patients.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';

interface Patient { id: number; firstName: string; lastName: string; doctorId: number; }

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule, HttpClientModule],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {
  results: Result[] = [];
  myPatients: Patient[] = [];
  allPatients: Patient[] = [];
  isLoading = true;
  isUploading = false;
  uploadProgress = '';
  showForm = false;
  isSaving = false;
  successMessage = '';

  form = { patientId: 0, title: '', description: '', fileName: '', fileUrl: '' };

  constructor(
    private service: ResultsService,
    private patientsService: PatientsService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadResults();
    this.loadPatients();
  }

  loadResults(): void {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: data => { this.results = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  loadPatients(): void {
    this.patientsService.getAll().subscribe({
      next: data => {
        this.allPatients = data;
        const me = this.authService.currentUser;
        this.myPatients = data.filter((p: any) => Number(p.doctorId) === Number(me?.id));
        this.cdr.detectChanges();
      }
    });
  }

  getPatientName(id: number): string {
    const p = this.allPatients.find(p => p.id === id);
    return p ? `${p.lastName} ${p.firstName}` : `Пациент #${id}`;
  }

  getPatientInitials(id: number): string {
    const p = this.allPatients.find(p => p.id === id);
    return p ? `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}` : '?';
  }

  getFileIcon(fileName: string): string {
    if (!fileName) return 'description';
    if (fileName.endsWith('.pdf')) return 'picture_as_pdf';
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) return 'image';
    return 'description';
  }

  getFileType(fileName: string): string {
    if (!fileName) return 'doc';
    if (fileName.endsWith('.pdf')) return 'pdf';
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) return 'image';
    return 'doc';
  }


  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.isUploading = true;
    this.uploadProgress = 'Загрузка...';
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');

    this.http.post<any>('http://localhost:3000/api/upload/file', formData, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: res => {
        this.form.fileName = res.data.fileName;
        this.form.fileUrl = res.data.fileUrl;
        this.isUploading = false;
        this.uploadProgress = '✓ ' + res.data.fileName;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isUploading = false;
        this.uploadProgress = 'Ошибка загрузки';
        this.cdr.detectChanges();
      }
    });
  }

  saveResult(): void {
    if (this.isSaving || !this.form.title || !this.form.patientId) return;
    this.isSaving = true;
    this.service.create(this.form).subscribe({
      next: () => {
        this.isSaving = false;
        this.showForm = false;
        this.form = { patientId: 0, title: '', description: '', fileName: '', fileUrl: '' };
        this.successMessage = 'Результат добавлен';
        this.cdr.detectChanges();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
        this.loadResults();
      },
      error: () => { this.isSaving = false; this.cdr.detectChanges(); }
    });
  }

  deleteResult(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('Удалить результат?')) return;
    this.results = this.results.filter(r => r.id !== id);
    this.cdr.detectChanges();
    this.service.delete(id).subscribe({ error: () => this.loadResults() });
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
