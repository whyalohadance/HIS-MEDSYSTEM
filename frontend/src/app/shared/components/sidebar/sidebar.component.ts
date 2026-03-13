import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
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
  private sub: Subscription = new Subscription();

  private adminNav: NavItem[] = [
    { label: 'Дашборд',       icon: 'dashboard',      route: '/dashboard' },
    { label: 'Персонал',      icon: 'badge',           route: '/staff' },
    { label: 'Пациенты',      icon: 'people',          route: '/patients' },
    { label: 'Приёмы',        icon: 'event',           route: '/appointments' },
    { label: 'Кабинеты',      icon: 'meeting_room',    route: '/rooms' },
    { label: 'Графики',       icon: 'calendar_month',  route: '/schedules' },
    { label: 'Обследования',  icon: 'biotech',         route: '/examinations' },
    { label: 'Результаты',    icon: 'assignment',      route: '/results' },
    { label: 'Уведомления',   icon: 'notifications',   route: '/notifications' },
    { label: 'Отзывы',        icon: 'star',            route: '/reviews' },
    { label: 'Отчёты',        icon: 'assessment',      route: '/reports' },
    { label: 'Профиль',       icon: 'person',          route: '/profile' },
  ];

  private doctorNav: NavItem[] = [
    { label: 'Дашборд',      icon: 'dashboard',    route: '/dashboard' },
    { label: 'Пациенты',     icon: 'people',       route: '/patients' },
    { label: 'Приёмы',       icon: 'event',        route: '/appointments' },
    { label: 'Мой кабинет',  icon: 'meeting_room', route: '/my-room' },
    { label: 'Результаты',   icon: 'assignment',   route: '/results' },
    { label: 'Уведомления',  icon: 'notifications', route: '/notifications' },
    { label: 'Профиль',      icon: 'person',       route: '/profile' },
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

  private patientNav: NavItem[] = [
    { label: 'Мои приёмы',    icon: 'event',         route: '/my-appointments' },
    { label: 'Мои результаты', icon: 'assignment',   route: '/my-results' },
    { label: 'Уведомления',   icon: 'notifications', route: '/notifications' },
    { label: 'Профиль',       icon: 'person',        route: '/profile' },
  ];

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe(user => {
      switch (user?.role) {
        case 'admin':        this.navItems = this.adminNav; break;
        case 'doctor':       this.navItems = this.doctorNav; break;
        case 'receptionist': this.navItems = this.receptionistNav; break;
        case 'patient':      this.navItems = this.patientNav; break;
        default:             this.navItems = this.doctorNav;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
