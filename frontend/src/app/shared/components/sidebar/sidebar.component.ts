import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { Subscription } from 'rxjs';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  navItems: NavItem[] = [];
  isOpen = false;
  collapsed = false;
  private subs = new Subscription();

  private adminNav: NavItem[] = [
    { label: 'Дашборд',      icon: 'dashboard',      route: '/dashboard' },
    { label: 'Персонал',     icon: 'badge',           route: '/staff' },
    { label: 'Пациенты',     icon: 'people',          route: '/patients' },
    { label: 'Приёмы',       icon: 'event',           route: '/appointments' },
    { label: 'Кабинеты',     icon: 'meeting_room',    route: '/rooms' },
    { label: 'Графики',      icon: 'calendar_month',  route: '/schedules' },
    { label: 'Обследования', icon: 'biotech',         route: '/examinations' },
    { label: 'Результаты',   icon: 'assignment',      route: '/results' },
    { label: 'Уведомления',  icon: 'notifications',   route: '/notifications' },
    { label: 'Отчёты',       icon: 'assessment',      route: '/reports' },
    { label: 'Профиль',      icon: 'person',          route: '/profile' },
  ];

  private doctorNav: NavItem[] = [
    { label: 'Дашборд',     icon: 'dashboard',     route: '/dashboard' },
    { label: 'Пациенты',    icon: 'people',        route: '/patients' },
    { label: 'Приёмы',      icon: 'event',         route: '/appointments' },
    { label: 'Мой кабинет', icon: 'meeting_room',  route: '/my-room' },
    { label: 'Результаты',  icon: 'assignment',    route: '/results' },
    { label: 'Уведомления', icon: 'notifications', route: '/notifications' },
    { label: 'Профиль',     icon: 'person',        route: '/profile' },
  ];

  private receptionistNav: NavItem[] = [
    { label: 'Дашборд',      icon: 'dashboard',     route: '/dashboard' },
    { label: 'Пациенты',     icon: 'people',        route: '/patients' },
    { label: 'Запись',       icon: 'edit_calendar', route: '/appointments' },
    { label: 'Кабинеты',     icon: 'meeting_room',  route: '/rooms' },
    { label: 'Обследования', icon: 'biotech',       route: '/examinations' },
    { label: 'Результаты',   icon: 'assignment',    route: '/results' },
    { label: 'Уведомления',  icon: 'notifications', route: '/notifications' },
    { label: 'Профиль',      icon: 'person',        route: '/profile' },
  ];

  constructor(
    public authService: AuthService,
    public sidebarService: SidebarService
  ) {}

  @HostListener('window:resize')
  onResize(): void {
    const w = window.innerWidth;
    if (w >= 1024) {
      this.collapsed = false;
      this.sidebarService.setCollapsed(false);
    } else if (w >= 768) {
      this.collapsed = true;
      this.sidebarService.setCollapsed(true);
    } else {
      this.collapsed = false;
      this.sidebarService.setCollapsed(false);
    }
  }

  ngOnInit(): void {
    this.onResize();

    this.subs.add(
      this.authService.currentUser$.subscribe(user => {
        switch (user?.role) {
          case 'admin':        this.navItems = this.adminNav; break;
          case 'doctor':       this.navItems = this.doctorNav; break;
          case 'receptionist': this.navItems = this.receptionistNav; break;
          default:             this.navItems = this.doctorNav;
        }
      })
    );
    this.subs.add(
      this.sidebarService.isOpen$.subscribe(open => this.isOpen = open)
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
