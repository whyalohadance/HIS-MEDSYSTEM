import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form = { email: '', password: '' };
  isLoading = false;
  error = '';
  animState: 'logo' | 'form' = 'logo';
  emailFocused = false;
  passwordFocused = false;
  showPassword = false;

  particles = Array.from({ length: 15 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5 + 's',
    duration: (Math.random() * 6 + 6) + 's',
    size: Math.random() * 4 + 2
  }));

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public langService: LanguageService
  ) {}

  ngOnInit(): void {
    const isMobile = window.innerWidth <= 768;
    setTimeout(() => {
      this.animState = 'form';
      this.cdr.detectChanges();
    }, isMobile ? 100 : 300);
  }

  fillDemo(email: string): void {
    this.form.email = email;
    this.form.password = 'password123';
  }

  login(): void {
    if (!this.form.email || !this.form.password) return;
    this.isLoading = true;
    this.error = '';

    this.authService.login(this.form.email, this.form.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading = false;
        this.error = 'Неверный email или пароль';
        this.cdr.detectChanges();
      }
    });
  }
}
