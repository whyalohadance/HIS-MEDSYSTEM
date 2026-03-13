import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MatMenuModule, MatIconModule, MatBadgeModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  unreadCount = 0;
  currentDate = new Date();

  constructor(
    private authService: AuthService,
    private notificationsService: NotificationsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    this.loadUnreadCount();
    setInterval(() => this.loadUnreadCount(), 30000);
  }

  loadUnreadCount(): void {
    this.notificationsService.getUnreadCount().subscribe({
      next: count => {
        this.unreadCount = count;
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(): string {
    if (!this.currentUser) return '?';
    return `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`;
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 17) return 'Добрый день';
    return 'Добрый вечер';
  }

  getRoleLabel(): string {
    const roles: Record<string, string> = {
      doctor: 'Врач',
      admin: 'Администратор',
      patient: 'Пациент'
    };
    return this.currentUser ? (roles[this.currentUser.role] || '') : '';
  }

  logout(): void {
    this.authService.logout();
  }
}
