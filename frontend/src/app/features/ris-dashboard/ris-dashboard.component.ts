import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-ris-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslateModule],
  templateUrl: './ris-dashboard.component.html',
  styleUrls: ['./ris-dashboard.component.scss']
})
export class RisDashboardComponent implements OnInit {
  stats = { total: 0, pending: 0, inProgress: 0, completed: 0 };
  pendingStudies: any[] = [];
  isLoading = true;
  todayStudies: any[] = [];
  weeklyStats: { date: string; count: number; isToday: boolean }[] = [];

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.get<any>('/studies').subscribe({
      next: (res) => {
        const all: any[] = res.data || [];
        this.stats.total      = all.length;
        this.stats.pending    = all.filter(s => ['pending','scheduled'].includes(s.status)).length;
        this.stats.inProgress = all.filter(s => s.status === 'in_progress').length;
        this.stats.completed  = all.filter(s => s.status === 'completed').length;
        this.pendingStudies   = all.filter(s => ['pending','scheduled','in_progress'].includes(s.status)).slice(0, 8);

        const today = new Date().toISOString().split('T')[0];
        this.todayStudies = all.filter(s =>
          (s.scheduledAt && String(s.scheduledAt).startsWith(today)) ||
          (s.createdAt   && String(s.createdAt).startsWith(today))
        );
        this.weeklyStats = this.calculateWeekly(all);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  calculateWeekly(studies: any[]): { date: string; count: number; isToday: boolean }[] {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      return {
        date: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
        count: studies.filter(s => s.completedAt && String(s.completedAt).startsWith(dateStr)).length,
        isToday: i === 6
      };
    });
  }

  getMaxDayCount(): number {
    return Math.max(...this.weeklyStats.map(d => d.count), 1);
  }

  getTodayPending():    number { return this.todayStudies.filter(s => ['pending','scheduled'].includes(s.status)).length; }
  getTodayInProgress(): number { return this.todayStudies.filter(s => s.status === 'in_progress').length; }
  getTodayCompleted():  number { return this.todayStudies.filter(s => s.status === 'completed').length; }

  getModalityIcon(type: string): string {
    return ({ mri: 'settings_input_antenna', ct: 'blur_on', xray: 'image', ultrasound: 'water', pet: 'biotech' } as any)[type] || 'medical_services';
  }

  getModalityLabel(type: string): string {
    return ({ mri: 'МРТ', ct: 'КТ', xray: 'Рентген', ultrasound: 'УЗИ', pet: 'ПЭТ' } as any)[type] || type;
  }

  getStatusLabel(s: string): string {
    return ({ pending: 'Ожидает', scheduled: 'Назначено', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменено' } as any)[s] || s;
  }

  getStatusClass(s: string): string {
    return ({ pending: 'st-pending', scheduled: 'st-scheduled', in_progress: 'st-progress', completed: 'st-done', cancelled: 'st-cancel' } as any)[s] || '';
  }
}
