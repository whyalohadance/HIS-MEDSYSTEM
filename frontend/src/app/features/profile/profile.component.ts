import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { User } from '../../core/models/user.model';
import { map } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface ApiResponse<T> { success: boolean; data: T; }

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // Для врача
  myRoom: any = null;
  mySchedules: any[] = [];

  form = { firstName: '', lastName: '', email: '', phone: '' };

  constructor(
    public authService: AuthService,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    if (this.authService.isDoctor) {
      this.loadMyRoom();
      this.loadMySchedules();
    }
  }

  loadProfile(): void {
    this.api.get<ApiResponse<User>>('/users/me').subscribe({
      next: res => {
        this.currentUser = res.data;
        localStorage.setItem('currentUser', JSON.stringify(res.data));
        this.authService['currentUserSubject'].next(res.data);
        this.form = {
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          email: res.data.email,
          phone: res.data.phone || '',
        };
        this.cdr.detectChanges();
      }
    });
  }

  loadMyRoom(): void {
    this.api.get<any>('/rooms').pipe(map(r => r.data)).subscribe({
      next: rooms => {
        const me = this.authService.currentUser;
        this.myRoom = rooms.find((r: any) => r.doctorId === me?.id) || null;
        this.cdr.detectChanges();
      }
    });
  }

  loadMySchedules(): void {
    this.api.get<any>('/schedules/my').pipe(map(r => r.data)).subscribe({
      next: data => { this.mySchedules = data; this.cdr.detectChanges(); },
      error: () => { this.mySchedules = []; this.cdr.detectChanges(); }
    });
  }

  saveProfile(): void {
    if (this.isSaving) return;
    this.isSaving = true;
    this.api.put<ApiResponse<User>>('/users/me', this.form).subscribe({
      next: res => {
        this.currentUser = res.data;
        localStorage.setItem('currentUser', JSON.stringify(res.data));
        this.authService['currentUserSubject'].next(res.data);
        this.isSaving = false;
        this.successMessage = 'Профиль обновлён!';
        this.cdr.detectChanges();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Ошибка сохранения';
        this.cdr.detectChanges();
      }
    });
  }

  getDayLabel(day: string): string {
    const keys: Record<string, string> = {
      monday: 'SCHEDULE.MONDAY', tuesday: 'SCHEDULE.TUESDAY', wednesday: 'SCHEDULE.WEDNESDAY',
      thursday: 'SCHEDULE.THURSDAY', friday: 'SCHEDULE.FRIDAY', saturday: 'SCHEDULE.SATURDAY', sunday: 'SCHEDULE.SUNDAY'
    };
    const key = keys[day];
    return key ? this.translate.instant(key) : day;
  }

  getInitials(): string {
    if (!this.currentUser) return '?';
    return `${this.currentUser.firstName?.[0] || ''}${this.currentUser.lastName?.[0] || ''}`;
  }

  getRoleLabel(): string {
    const keys: Record<string, string> = {
      doctor: 'STAFF.ROLE_DOCTOR', admin: 'STAFF.ROLE_ADMIN', patient: 'PATIENTS.TITLE', receptionist: 'STAFF.ROLE_RECEPTIONIST'
    };
    if (!this.currentUser) return '';
    const key = keys[this.currentUser.role];
    return key ? this.translate.instant(key) : this.currentUser.role;
  }
}
