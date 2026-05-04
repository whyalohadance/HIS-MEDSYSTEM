import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { LanguageService } from '../../../core/services/language.service';
import { User } from '../../../core/models/user.model';
import { Notification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  unreadCount = 0;
  notifications: Notification[] = [];
  showNotifPanel = false;
  currentDate = new Date();
  isDarkTheme = false;
  showUserDropdown = false;

  private pollInterval: any;

  constructor(
    private authService: AuthService,
    private notificationsService: NotificationsService,
    private sidebarService: SidebarService,
    private cdr: ChangeDetectorRef,
    public langService: LanguageService,
    private translate: TranslateService,
    private router: Router
  ) {}

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showUserDropdown) {
      this.showUserDropdown = false;
      this.cdr.detectChanges();
    }
    if (this.showNotifPanel) {
      this.showNotifPanel = false;
      this.cdr.detectChanges();
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    this.loadUnreadCount();
    this.pollInterval = setInterval(() => this.loadUnreadCount(), 30000);

    this.isDarkTheme = localStorage.getItem('darkTheme') === 'true';
    document.body.classList.toggle('dark-theme', this.isDarkTheme);

    this.translate.onLangChange.subscribe(() => this.cdr.detectChanges());
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  loadUnreadCount(): void {
    this.notificationsService.getUnreadCount().subscribe({
      next: count => {
        this.unreadCount = count;
        this.cdr.detectChanges();
      }
    });
  }

  toggleNotifPanel(event: Event): void {
    event.stopPropagation();
    this.showNotifPanel = !this.showNotifPanel;
    this.showUserDropdown = false;
    if (this.showNotifPanel) {
      this.loadNotifications();
    }
    this.cdr.detectChanges();
  }

  loadNotifications(): void {
    this.notificationsService.getAll().subscribe({
      next: data => {
        this.notifications = data;
        this.cdr.detectChanges();
      }
    });
  }

  openNotif(n: Notification): void {
    if (!n.isRead) {
      this.notificationsService.markAsRead(n.id).subscribe(() => {
        n.isRead = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.cdr.detectChanges();
      });
    }
    if (n.link) {
      this.router.navigate([n.link]);
      this.showNotifPanel = false;
      this.cdr.detectChanges();
    }
  }

  deleteNotif(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationsService.delete(id).subscribe(() => {
      const removed = this.notifications.find(n => n.id === id);
      if (removed && !removed.isRead) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.cdr.detectChanges();
    });
  }

  markAllRead(): void {
    this.notificationsService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => (n.isRead = true));
      this.unreadCount = 0;
      this.cdr.detectChanges();
    });
  }

  getNotifIcon(type: string): string {
    const map: Record<string, string> = {
      appointment_reminder: 'event',
      lab_result_ready: 'biotech',
      lab_critical: 'warning',
      study_report_ready: 'radiology',
      monthly_report: 'description',
      system: 'info',
    };
    return map[type] || 'notifications';
  }

  getTimeAgo(date: string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'только что';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
    return `${Math.floor(seconds / 86400)} дн назад`;
  }

  getInitials(): string {
    if (!this.currentUser) return '?';
    return `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`;
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'DASHBOARD.GREETING_MORNING';
    if (hour < 17) return 'DASHBOARD.GREETING_DAY';
    return 'DASHBOARD.GREETING_EVENING';
  }

  getRoleLabel(): string {
    const roles: Record<string, string> = {
      doctor: 'STAFF.ROLE_DOCTOR',
      admin: 'STAFF.ROLE_ADMIN',
      receptionist: 'STAFF.ROLE_RECEPTIONIST',
      patient: 'Пациент',
    };
    return this.currentUser ? (roles[this.currentUser.role] || '') : '';
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
    localStorage.setItem('darkTheme', String(this.isDarkTheme));
  }

  toggleUserDropdown(event: Event): void {
    event.stopPropagation();
    this.showUserDropdown = !this.showUserDropdown;
    this.showNotifPanel = false;
  }

  closeDropdown(): void {
    this.showUserDropdown = false;
  }

  onLangChange(lang: string, event: MouseEvent): void {
    const btn = event.currentTarget as HTMLElement;
    btn.classList.add('lang-clicking');
    setTimeout(() => btn.classList.remove('lang-clicking'), 300);
    this.langService.setLanguage(lang);
  }

  logout(): void {
    this.showUserDropdown = false;
    this.authService.logout();
  }

  getFormattedDate(): string {
    const lang = this.translate.currentLang || 'ru';
    const localeMap: Record<string, string> = { ru: 'ru-RU', ro: 'ro-RO', en: 'en-US' };
    const locale = localeMap[lang] || 'ru-RU';
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
