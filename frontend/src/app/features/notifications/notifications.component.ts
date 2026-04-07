import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationsService } from '../../core/services/notifications.service';
import { Notification } from '../../core/models/notification.model';
import { TranslateModule } from '@ngx-translate/core';

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
    private cdr: ChangeDetectorRef
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

  getIcon(title: string): string {
    if (title.toLowerCase().includes('приём')) return 'event';
    if (title.toLowerCase().includes('результат')) return 'assignment';
    if (title.toLowerCase().includes('отзыв')) return 'star';
    return 'notifications';
  }
}
