import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { filter } from 'rxjs';
import { routeAnimations } from '../../../animations';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  animations: [routeAnimations],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-wrapper">
        <app-header></app-header>
        <main class="main-content" [@routeAnimations]="routeState">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; min-height: 100vh; }
    .main-wrapper { margin-left: 220px; flex: 1; display: flex; flex-direction: column; transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .main-content { flex: 1; padding: 24px; background: #f4f6f9; overflow-x: hidden; position: relative; }
    @media (max-width: 1024px) and (min-width: 768px) { .main-wrapper { margin-left: 64px; } }
    @media (max-width: 768px) { .main-wrapper { margin-left: 0; } .main-content { padding: 16px; } }
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
