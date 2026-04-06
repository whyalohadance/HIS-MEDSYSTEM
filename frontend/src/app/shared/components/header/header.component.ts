import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { LanguageService } from '../../../core/services/language.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  unreadCount = 0;
  currentDate = new Date();
  isDarkTheme = false;
  showUserDropdown = false;

  constructor(
    private authService: AuthService,
    private notificationsService: NotificationsService,
    private sidebarService: SidebarService,
    private cdr: ChangeDetectorRef,
    public langService: LanguageService
  ) {}

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showUserDropdown) {
      this.showUserDropdown = false;
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
    setInterval(() => this.loadUnreadCount(), 30000);
    this.isDarkTheme = localStorage.getItem('darkTheme') === 'true';
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
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
    if (hour < 12) return 'DASHBOARD.GREETING_MORNING';
    if (hour < 17) return 'DASHBOARD.GREETING_DAY';
    return 'DASHBOARD.GREETING_EVENING';
  }

  getRoleLabel(): string {
    const roles: Record<string, string> = {
      doctor: 'STAFF.ROLE_DOCTOR',
      admin: 'STAFF.ROLE_ADMIN',
      receptionist: 'STAFF.ROLE_RECEPTIONIST',
      patient: 'Пациент'
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
  }

  closeDropdown(): void {
    this.showUserDropdown = false;
  }

  logout(): void {
    this.showUserDropdown = false;
    this.authService.logout();
  }
}
