import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationsService } from '../../core/services/notifications.service';
import { Notification } from '../../core/models/notification.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  isLoading = true;

  constructor(
    private service: NotificationsService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: data => {
        this.notifications = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  markAsRead(id: number): void {
    this.service.markAsRead(id).subscribe({
      next: () => this.loadNotifications()
    });
  }

  markAllRead(): void {
    this.service.markAllAsRead().subscribe({
      next: () => this.loadNotifications()
    });
  }

  parseMessage(message: string): string {
    if (!message || !message.startsWith('KEY:')) return message;
    const parts = message.split('|');
    const key = parts[0].replace('KEY:', '');
    const params: any = {};
    parts.slice(1).forEach(part => {
      const eqIdx = part.indexOf(':');
      if (eqIdx > -1) {
        params[part.substring(0, eqIdx)] = part.substring(eqIdx + 1);
      }
    });
    return this.translate.instant('NOTIFICATIONS.' + key, params);
  }

  getIcon(title: string): string {
    if (!title) return 'notifications';
    if (title.startsWith('KEY:')) {
      const key = title.replace('KEY:', '');
      if (key.includes('APPOINTMENT')) return 'event';
      if (key.includes('RESULT')) return 'assignment';
      if (key.includes('REPORT')) return 'bar_chart';
      if (key.includes('PATIENT')) return 'person';
      return 'notifications';
    }
    if (title.toLowerCase().includes('приём')) return 'event';
    if (title.toLowerCase().includes('результат')) return 'assignment';
    if (title.toLowerCase().includes('отчёт')) return 'bar_chart';
    if (title.toLowerCase().includes('отзыв')) return 'star';
    return 'notifications';
  }
}
