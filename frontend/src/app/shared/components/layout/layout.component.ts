import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { ToastComponent } from '../toast/toast.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { filter } from 'rxjs';
import { routeAnimations } from '../../../animations';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, BottomNavComponent, ToastComponent, ConfirmDialogComponent],
  animations: [routeAnimations],
  template: `
    <app-toast></app-toast>
    <app-confirm-dialog></app-confirm-dialog>
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-wrapper">
        <app-header></app-header>
        <main class="main-content" [@routeAnimations]="routeState">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
    <app-bottom-nav></app-bottom-nav>
  `,
  styles: [`
    .app-layout { display: flex; min-height: 100vh; }
    .main-wrapper { margin-left: 240px; flex: 1; display: flex; flex-direction: column; transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .main-content { flex: 1; padding: 24px; background: #f4f6f9; overflow-x: hidden; position: relative; }
    @media (max-width: 1024px) and (min-width: 768px) { .main-wrapper { margin-left: 64px; } }
    @media (max-width: 768px) { .main-wrapper { margin-left: 0; } .main-content { padding: 16px; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); } }
  `]
})
export class LayoutComponent implements OnInit {
  routeState = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.routeState++;
    });
  }
}
