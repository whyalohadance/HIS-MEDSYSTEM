import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, NgClass, FormsModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form = { email: '', password: '' };
  isLoading = false;
  error = '';
  animState: 'logo' | 'moving' | 'form' = 'logo';
  formVisible = false;
  showPassword = false;
  emailFocused = false;
  passwordFocused = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public langService: LanguageService
  ) {}

  ngOnInit(): void {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      this.animState = 'form';
      this.formVisible = true;
      this.cdr.detectChanges();
      return;
    }

    setTimeout(() => {
      this.animState = 'moving';
      this.cdr.detectChanges();
    }, 1800);

    setTimeout(() => {
      this.animState = 'form';
      this.formVisible = true;
      this.cdr.detectChanges();
    }, 2600);
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
