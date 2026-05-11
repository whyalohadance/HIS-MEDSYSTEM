import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  currentUser: any = null;
  isAdmin = false;

  // Список всего персонала (для админа)
  allStaff: any[] = [];
  filteredStaff: any[] = [];
  searchTerm = '';
  selectedRole = 'all';

  // Сейчас редактируется
  selectedUserId: number | null = null;
  selectedUser: any = null;

  // Форма редактирования
  formData: any = this.emptyForm();

  // Состояния
  isLoading = false;
  isSaving = false;
  changingPassword = false;

  // Пароль (отдельная форма)
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  roles = [
    { value: 'all', label: 'Все', labelKey: 'STAFF.ROLES.ALL', icon: 'apps', color: '#64748b' },
    { value: 'admin', label: 'Админы', labelKey: 'STAFF.ROLES.ADMIN', icon: 'admin_panel_settings', color: '#1a73e8' },
    { value: 'doctor', label: 'Врачи', labelKey: 'STAFF.ROLES.DOCTOR', icon: 'medical_services', color: '#10b981' },
    { value: 'receptionist', label: 'Ресепшн', labelKey: 'STAFF.ROLES.RECEPTIONIST', icon: 'support_agent', color: '#f59e0b' },
    { value: 'radiologist', label: 'Радиологи', labelKey: 'STAFF.ROLES.RADIOLOGIST', icon: 'medical_information', color: '#7c3aed' },
    { value: 'lab_technician', label: 'Лаборанты', labelKey: 'STAFF.ROLES.LAB_TECHNICIAN', icon: 'biotech', color: '#06b6d4' }
  ];

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  private emptyForm(): any {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'doctor',
      specialization: '',
      isActive: true
    };
  }

  loadCurrentUser(): void {
    const stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.isAdmin = stored.role === 'admin';

    if (this.isAdmin) {
      this.loadAllStaff();
      // If navigated from /staff with ?userId=X, open that user
      const queryUserId = this.route.snapshot.queryParamMap.get('userId');
      const targetId = queryUserId ? +queryUserId : stored.id;
      this.selectUser(targetId);
    } else {
      this.loadOwnProfile();
    }
  }

  loadOwnProfile(): void {
    this.api.get<any>('/users/me').subscribe({
      next: (res) => {
        const user = res.data || res;
        this.selectedUser = user;
        this.selectedUserId = user.id;
        this.formData = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'doctor',
          specialization: user.specialization || '',
          isActive: user.isActive !== false
        };
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Ошибка загрузки профиля');
        this.cdr.detectChanges();
      }
    });
  }

  loadAllStaff(): void {
    this.isLoading = true;
    this.api.get<any>('/users').subscribe({
      next: (res) => {
        this.allStaff = res.data || res || [];
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.toast.error('Ошибка загрузки персонала');
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let result = [...this.allStaff];

    if (this.selectedRole !== 'all') {
      result = result.filter(u => u.role === this.selectedRole);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(u =>
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }

    this.filteredStaff = result;
    this.cdr.detectChanges();
  }

  setRole(role: string): void {
    this.selectedRole = role;
    this.applyFilter();
  }

  selectUser(userId: number): void {
    this.selectedUserId = userId;
    this.api.get<any>(`/users/${userId}`).subscribe({
      next: (res) => {
        const user = res.data || res;
        this.selectedUser = user;
        this.formData = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role || 'doctor',
          specialization: user.specialization || '',
          isActive: user.isActive !== false
        };
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.changingPassword = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Ошибка загрузки профиля');
        this.cdr.detectChanges();
      }
    });
  }

  isMyProfile(): boolean {
    const stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return stored.id === this.selectedUserId;
  }

  canEdit(): boolean {
    return this.isAdmin;
  }

  save(): void {
    if (!this.canEdit()) {
      this.toast.error('Только администратор может редактировать профили');
      return;
    }

    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email) {
      this.toast.error('Заполни обязательные поля');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    const payload = { ...this.formData };

    this.api.patch(`/users/${this.selectedUserId}`, payload).subscribe({
      next: () => {
        this.toast.success('Профиль обновлён');
        this.isSaving = false;

        this.loadAllStaff();
        this.selectUser(this.selectedUserId!);

        if (this.isMyProfile()) {
          const stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
          const updated = { ...stored, ...payload };
          localStorage.setItem('currentUser', JSON.stringify(updated));
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        this.toast.error(err?.error?.error?.message || 'Ошибка сохранения');
        this.cdr.detectChanges();
      }
    });
  }

  toggleChangePassword(): void {
    this.changingPassword = !this.changingPassword;
    this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.cdr.detectChanges();
  }

  savePassword(): void {
    if (!this.canEdit()) return;

    if (!this.passwordData.newPassword || this.passwordData.newPassword.length < 6) {
      this.toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.toast.error('Пароли не совпадают');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    this.api.patch(`/users/${this.selectedUserId}`, {
      password: this.passwordData.newPassword
    }).subscribe({
      next: () => {
        this.toast.success('Пароль изменён');
        this.changingPassword = false;
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSaving = false;
        this.toast.error(err?.error?.error?.message || 'Ошибка');
        this.cdr.detectChanges();
      }
    });
  }

  toggleActive(): void {
    if (!this.canEdit()) return;
    if (this.isMyProfile() && this.selectedUser?.isActive) {
      this.toast.error('Нельзя деактивировать свой собственный аккаунт');
      return;
    }

    this.formData.isActive = !this.formData.isActive;
    this.save();
  }

  getRoleInfo(role: string): any {
    return this.roles.find(r => r.value === role) || { value: role, label: role, icon: 'person', color: '#64748b' };
  }

  getInitials(user: any): string {
    if (!user) return '??';
    return (user.firstName?.[0] || '') + (user.lastName?.[0] || '');
  }

  countByRole(role: string): number {
    return this.allStaff.filter(u => u.role === role).length;
  }
}
