import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-my-room',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Мой кабинет</h1>
        <p class="page-sub">Информация о вашем рабочем кабинете</p>
      </div>
      <div class="card-info">
        <span class="material-icons">meeting_room</span>
        <p>Кабинет будет назначен администратором</p>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 700px; }
    .page-header { margin-bottom: 28px; }
    .page-title { font-size: 26px; font-weight: 700; color: #0f2d52; }
    .page-sub { font-size: 14px; color: #718096; margin-top: 4px; }
    .card-info { display: flex; flex-direction: column; align-items: center; padding: 60px; background: white; border-radius: 14px; border: 1px solid #e2e8f0; color: #a0aec0; gap: 12px; }
    .card-info .material-icons { font-size: 48px; }
  `]
})
export class MyRoomComponent {}
