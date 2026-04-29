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
  recentOrders: any[] = [];
  isLoading = true;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.get<any>('/lab/stats').subscribe({
      next: (res) => { this.stats = res.data || this.stats; this.cdr.detectChanges(); },
      error: () => {}
    });

    this.api.get<any>('/lab/worklist').subscribe({
      next: (res) => {
        this.worklist = (res.data || []).slice(0, 8);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });

    this.api.get<any>('/lab/orders').subscribe({
      next: (res) => { this.recentOrders = (res.data || []).slice(0, 5); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  getPriorityLabel(p: string): string {
    return { stat: 'STAT', urgent: 'Срочно', routine: 'Плановый' }[p] || p;
  }

  getPriorityClass(p: string): string {
    return { stat: 'priority-stat', urgent: 'priority-urgent', routine: 'priority-routine' }[p] || '';
  }

  getStatusLabel(s: string): string {
    return { pending: 'Ожидает', in_progress: 'В работе', completed: 'Готово', cancelled: 'Отменён' }[s] || s;
  }
}
