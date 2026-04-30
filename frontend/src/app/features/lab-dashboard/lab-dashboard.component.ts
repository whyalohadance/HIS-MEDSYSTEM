import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-lab-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslateModule],
  templateUrl: './lab-dashboard.component.html',
  styleUrls: ['./lab-dashboard.component.scss']
})
export class LabDashboardComponent implements OnInit {
  stats: any = { total: 0, pending: 0, inProgress: 0, completed: 0 };
  worklist: any[] = [];
  isLoading = true;
  todayOrders: any[] = [];
  weeklyStats: { date: string; count: number; isToday: boolean }[] = [];

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadWorklist();
    this.loadDashboardData();
  }

  loadStats(): void {
    this.api.get<any>('/lab/stats').subscribe({
      next: (res) => { this.stats = res.data || this.stats; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  loadWorklist(): void {
    this.api.get<any>('/lab/worklist').subscribe({
      next: (res) => {
        this.worklist = (res.data || []).slice(0, 8);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  loadDashboardData(): void {
    this.api.get<any>('/lab/orders').subscribe({
      next: (res) => {
        const all: any[] = res.data || [];
        const today = new Date().toISOString().split('T')[0];
        this.todayOrders = all.filter((o: any) =>
          (o.scheduledAt && String(o.scheduledAt).startsWith(today)) ||
          (o.createdAt   && String(o.createdAt).startsWith(today))
        );
        this.weeklyStats = this.calculateWeekly(all);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  calculateWeekly(orders: any[]): { date: string; count: number; isToday: boolean }[] {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      return {
        date: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
        count: orders.filter(o => o.completedAt && String(o.completedAt).startsWith(dateStr)).length,
        isToday: i === 6
      };
    });
  }

  getMaxDayCount(): number {
    return Math.max(...this.weeklyStats.map(d => d.count), 1);
  }

  getTodayPending():    number { return this.todayOrders.filter(o => o.status === 'pending').length; }
  getTodayInProgress(): number { return this.todayOrders.filter(o => o.status === 'in_progress').length; }
  getTodayCompleted():  number { return this.todayOrders.filter(o => o.status === 'completed').length; }

  getPriorityLabel(p: string): string {
    return ({ stat: 'STAT', urgent: 'Срочно', routine: 'Плановый' } as any)[p] || p;
  }

  getPriorityClass(p: string): string {
    return ({ stat: 'priority-stat', urgent: 'priority-urgent', routine: 'priority-routine' } as any)[p] || '';
  }
}
