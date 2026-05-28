import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  isLanguageChanging = false;

  demoAccounts = [
    { role: 'admin',         email: 'admin@med.com',     label: 'Admin',     icon: 'admin_panel_settings', color: '#1a73e8' },
    { role: 'doctor',        email: 'doctor@med.com',    label: 'Doctor',    icon: 'medical_services',     color: '#10b981' },
    { role: 'receptionist',  email: 'reception@med.com', label: 'Reception', icon: 'support_agent',        color: '#f59e0b' },
    { role: 'radiologist',   email: 'radiolog@med.com',  label: 'RIS',       icon: 'medical_information',  color: '#7c3aed' },
    { role: 'lab_technician',email: 'lab@med.com',       label: 'LIS',       icon: 'biotech',              color: '#06b6d4' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public langService: LanguageService,
    private translate: TranslateService
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

  loginAs(acc: { email: string; role: string }): void {
    this.form.email = acc.email;
    this.form.password = 'password123';
    this.login();
  }

  changeLanguage(lang: string): void {
    if (this.langService.getCurrentLanguage() === lang) return;
    this.isLanguageChanging = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.langService.setLanguage(lang);
      this.translate.use(lang);
      setTimeout(() => {
        this.isLanguageChanging = false;
        this.cdr.detectChanges();
      }, 200);
    }, 100);
  }

  private getRoleRoute(role: string): string {
    if (role === 'lab_technician') return '/lab-dashboard';
    if (role === 'radiologist') return '/ris-dashboard';
    return '/dashboard';
  }

  login(): void {
    if (!this.form.email || !this.form.password) return;
    this.isLoading = true;
    this.error = '';

    this.authService.login(this.form.email, this.form.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        const role = res?.data?.user?.role || this.authService.role;
        const firstLogin = this.route.snapshot.queryParams['firstLogin'];
        if (firstLogin === 'true' && role === 'admin') {
          this.router.navigate(['/welcome']);
        } else {
          this.router.navigate([this.getRoleRoute(role)]);
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg: string = err?.error?.error?.message || err?.error?.message || '';
        if (err?.status === 429) {
          this.error = 'AUTH.ERROR_THROTTLE';
        } else if (err?.status === 401 && msg.includes('blocat')) {
          this.error = 'AUTH.ERROR_LOCKED';
        } else {
          this.error = 'AUTH.ERROR_INVALID';
        }
        this.cdr.detectChanges();
      }
    });
  }
}
