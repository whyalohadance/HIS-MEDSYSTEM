import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

Chart.register(...registerables);

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss']
})
export class StaffComponent implements OnInit, AfterViewInit {
  staff: any[] = [];
  filtered: any[] = [];
  searchTerm = '';
  selectedRole = 'all';
  isLoading = false;

  stats: any = {
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {}
  };

  showCreateModal = false;
  newUser: any = this.emptyUser();
  isCreating = false;

  isAdmin = false;

  @ViewChild('activityChart') activityChartRef!: ElementRef;
  private activityChart: any;

  roles = [
    { value: 'all', label: 'Все', icon: 'apps', color: '#64748b' },
    { value: 'admin', label: 'Админы', icon: 'admin_panel_settings', color: '#1a73e8' },
    { value: 'doctor', label: 'Врачи', icon: 'medical_services', color: '#10b981' },
    { value: 'receptionist', label: 'Ресепшн', icon: 'support_agent', color: '#f59e0b' },
    { value: 'radiologist', label: 'Радиологи', icon: 'medical_information', color: '#7c3aed' },
    { value: 'lab_technician', label: 'Лаборанты', icon: 'biotech', color: '#06b6d4' }
  ];

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.isAdmin = user.role === 'admin';
    this.loadAll();
  }

  ngAfterViewInit(): void {
    // Chart renders after data loads
  }

  emptyUser(): any {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'doctor',
      specialization: ''
    };
  }

  loadAll(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    // Try to load stats and activity in parallel
    let statsLoaded = false;
    let activityLoaded = false;

    const tryRenderChart = () => {
      if (statsLoaded && activityLoaded) {
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderChart(), 100);
      }
    };

    this.api.get<any>('/users/stats').subscribe({
      next: (res) => {
        this.stats = res.data || res;
        statsLoaded = true;
        tryRenderChart();
      },
      error: () => {
        statsLoaded = true;
        tryRenderChart();
      }
    });

    this.api.get<any>('/users/with-activity').subscribe({
      next: (res) => {
        this.staff = res.data || res || [];
        this.applyFilter();
        activityLoaded = true;
        tryRenderChart();
      },
      error: () => {
        // Fallback to basic /users
        this.api.get<any>('/users').subscribe({
          next: (r) => {
            this.staff = r.data || [];
            this.calculateStatsLocally();
            this.applyFilter();
            activityLoaded = true;
            tryRenderChart();
          },
          error: () => {
            activityLoaded = true;
            this.toast.error('Ошибка загрузки персонала');
            tryRenderChart();
          }
        });
      }
    });
  }

  calculateStatsLocally(): void {
    this.stats.total = this.staff.length;
    this.stats.active = this.staff.filter(u => u.isActive !== false).length;
    this.stats.inactive = this.staff.filter(u => u.isActive === false).length;
    this.stats.byRole = {};
    for (const u of this.staff) {
      this.stats.byRole[u.role] = (this.stats.byRole[u.role] || 0) + 1;
    }
  }

  applyFilter(): void {
    let result = [...this.staff];

    if (this.selectedRole !== 'all') {
      result = result.filter(u => u.role === this.selectedRole);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(u =>
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.specialization?.toLowerCase().includes(term)
      );
    }

    this.filtered = result;
    this.cdr.detectChanges();
  }

  setRole(role: string): void {
    this.selectedRole = role;
    this.applyFilter();
  }

  goToProfile(userId: number): void {
    this.router.navigate(['/profile'], { queryParams: { userId } });
  }

  openCreate(): void {
    if (!this.isAdmin) return;
    this.newUser = this.emptyUser();
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  createUser(): void {
    if (!this.newUser.firstName || !this.newUser.lastName || !this.newUser.email || !this.newUser.password) {
      this.toast.error('Заполни все обязательные поля');
      return;
    }
    if (this.newUser.password.length < 6) {
      this.toast.error('Пароль минимум 6 символов');
      return;
    }

    this.isCreating = true;
    this.cdr.detectChanges();

    this.api.post<any>('/users', this.newUser).subscribe({
      next: () => {
        this.toast.success('Сотрудник создан');
        this.showCreateModal = false;
        this.isCreating = false;
        this.loadAll();
      },
      error: (err) => {
        this.isCreating = false;
        this.toast.error(err?.error?.error?.message || 'Ошибка создания');
        this.cdr.detectChanges();
      }
    });
  }

  getRoleInfo(role: string): any {
    return this.roles.find(r => r.value === role) || { value: role, label: role, icon: 'person', color: '#64748b' };
  }

  getInitials(u: any): string {
    return (u.firstName?.[0] || '') + (u.lastName?.[0] || '');
  }

  getActivityLevel(u: any): string {
    const count = u.todayCount || 0;
    if (count >= 5) return 'high';
    if (count >= 2) return 'medium';
    if (count >= 1) return 'low';
    return 'none';
  }

  renderChart(): void {
    if (!this.activityChartRef?.nativeElement) return;
    if (this.activityChart) { this.activityChart.destroy(); this.activityChart = null; }

    const topStaff = [...this.staff]
      .filter(u => u.role !== 'admin' && u.role !== 'receptionist')
      .sort((a, b) => (b.weekCount || 0) - (a.weekCount || 0))
      .slice(0, 5);

    if (topStaff.length === 0) return;

    this.activityChart = new Chart(this.activityChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: topStaff.map(u => `${u.firstName} ${u.lastName?.[0] || ''}.`),
        datasets: [{
          label: 'За неделю',
          data: topStaff.map(u => u.weekCount || 0),
          backgroundColor: topStaff.map(u => this.getRoleInfo(u.role).color + 'cc'),
          borderColor: topStaff.map(u => this.getRoleInfo(u.role).color),
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f1f5f9' } },
          y: { grid: { display: false } }
        }
      }
    });
  }
}
