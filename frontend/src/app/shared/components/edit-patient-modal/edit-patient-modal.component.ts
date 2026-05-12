import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-edit-patient-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './edit-patient-modal.component.html',
  styleUrls: ['./edit-patient-modal.component.scss']
})
export class EditPatientModalComponent implements OnInit, OnChanges {
  @Input() patientId!: number;
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  patient: any = null;
  isLoading = false;
  isSaving = false;
  isAdmin = false;

  formData: any = {
    firstName: '',
    lastName: '',
    gender: 'male',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    bloodType: ''
  };

  readonly bloodTypes = [
    { value: '', label: '— Не указано —' },
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.isAdmin = user.role === 'admin';
  }

  ngOnChanges(): void {
    if (this.show && this.patientId) {
      this.loadPatient();
    }
  }

  loadPatient(): void {
    this.isLoading = true;
    this.patient = null;
    this.cdr.detectChanges();

    this.api.get<any>(`/patients/${this.patientId}`).subscribe({
      next: (res) => {
        this.patient = res.data;
        this.formData = {
          firstName: this.patient.firstName || '',
          lastName: this.patient.lastName || '',
          gender: this.patient.gender || 'male',
          dateOfBirth: this.patient.dateOfBirth?.split('T')[0] || '',
          phone: this.patient.phone || '',
          email: this.patient.email || '',
          address: this.patient.address || '',
          bloodType: this.patient.bloodType || ''
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Не удалось загрузить данные пациента');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    if (!this.isAdmin) {
      this.toast.error('Только администратор может редактировать');
      return;
    }
    if (!this.formData.firstName || !this.formData.lastName) {
      this.toast.error('Заполни имя и фамилию');
      return;
    }
    this.isSaving = true;
    this.cdr.detectChanges();

    this.api.patch(`/patients/${this.patientId}`, this.formData).subscribe({
      next: (res: any) => {
        this.toast.success('Данные пациента обновлены');
        this.isSaving = false;
        this.saved.emit(res?.data || this.formData);
        this.close.emit();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSaving = false;
        this.toast.error(err?.error?.error?.message || 'Ошибка сохранения');
        this.cdr.detectChanges();
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  getAge(): number {
    if (!this.formData.dateOfBirth) return 0;
    const dob = new Date(this.formData.dateOfBirth);
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }
}
