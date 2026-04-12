import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { Subscription } from 'rxjs';

interface NavItem {
  key: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  navItems: NavItem[] = [];
  isOpen = false;
  collapsed = false;
  private subs = new Subscription();

  private adminNav: NavItem[] = [
    { key: 'NAV.DASHBOARD',    icon: 'dashboard',      route: '/dashboard' },
    { key: 'NAV.STAFF',        icon: 'badge',           route: '/staff' },
    { key: 'NAV.PATIENTS',     icon: 'people',          route: '/patients' },
    { key: 'NAV.APPOINTMENTS', icon: 'event',           route: '/appointments' },
    { key: 'NAV.ROOMS',        icon: 'meeting_room',    route: '/rooms' },
    { key: 'NAV.SCHEDULES',    icon: 'calendar_month',  route: '/schedules' },
    { key: 'NAV.EXAMINATIONS', icon: 'biotech',         route: '/examinations' },
    { key: 'STUDIES.TITLE',    icon: 'radiology',       route: '/studies' },
    { key: 'STUDIES.WORKLIST', icon: 'list_alt',        route: '/worklist' },
    { key: 'NAV.NOTIFICATIONS',icon: 'notifications',   route: '/notifications' },
    { key: 'NAV.REPORTS',      icon: 'assessment',      route: '/reports' },
    { key: 'NAV.PROFILE',      icon: 'person',          route: '/profile' },
  ];

  private doctorNav: NavItem[] = [
    { key: 'NAV.DASHBOARD',    icon: 'dashboard',     route: '/dashboard' },
    { key: 'NAV.PATIENTS',     icon: 'people',        route: '/patients' },
    { key: 'NAV.APPOINTMENTS', icon: 'event',         route: '/appointments' },
    { key: 'NAV.MY_CABINET',   icon: 'meeting_room',  route: '/my-cabinet' },
    { key: 'STUDIES.TITLE',    icon: 'radiology',     route: '/studies' },
    { key: 'STUDIES.WORKLIST', icon: 'list_alt',      route: '/worklist' },
    { key: 'NAV.NOTIFICATIONS',icon: 'notifications', route: '/notifications' },
    { key: 'NAV.PROFILE',      icon: 'person',        route: '/profile' },
  ];

  private receptionistNav: NavItem[] = [
    { key: 'NAV.DASHBOARD',    icon: 'dashboard',     route: '/dashboard' },
    { key: 'NAV.PATIENTS',     icon: 'people',        route: '/patients' },
    { key: 'NAV.APPOINTMENTS', icon: 'edit_calendar', route: '/appointments' },
    { key: 'NAV.ROOMS',        icon: 'meeting_room',  route: '/rooms' },
    { key: 'NAV.EXAMINATIONS', icon: 'biotech',       route: '/examinations' },
    { key: 'NAV.NOTIFICATIONS',icon: 'notifications', route: '/notifications' },
    { key: 'NAV.PROFILE',      icon: 'person',        route: '/profile' },
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
