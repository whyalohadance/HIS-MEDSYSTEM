import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PatientsService } from '../../core/services/patients.service';
import { AppointmentsService } from '../../core/services/appointments.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { ResultsService } from '../../core/services/results.service';
import { TranslateService } from '@ngx-translate/core';
import { map, forkJoin } from 'rxjs';

interface QueueItem {
  queueNumber: string;
  patientId: number;
  patientName: string;
  doctorName: string;
  time: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslateModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private statusChart: Chart | null = null;
  private monthChart: Chart | null = null;
  private doctorWeekChart: Chart | null = null;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthChart') monthChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doctorWeekChart') doctorWeekChartRef!: ElementRef<HTMLCanvasElement>;

  isLoading = true;
  today = new Date();
  chartsReady = false;

  adminStats: any = null;
  allAppointments: any[] = [];

  doctorPatients = 0;
  doctorAppointmentsToday = 0;
  doctorResults = 0;
  doctorScheduled = 0;
  recentAppointments: any[] = [];
  todayAppointments: any[] = [];
  upcomingAppointments: any[] = [];
  todayPatients: any[] = [];
  doctorAllAppointments: any[] = [];

  receptionAppointmentsToday = 0;
  receptionScheduled = 0;
  receptionTotal = 0;
  receptionPatients = 0;
  receptionTodayAppointments: any[] = [];
  receptionRecentPatients: any[] = [];
  receptionDoctors: any[] = [];
  receptionRooms: any[] = [];

  queueItems: QueueItem[] = [];
  queueCompleted = 0;
  queueTotal = 0;

  allPatients: any[] = [];
  private allDoctors: any[] = [];

  constructor(
    public authService: AuthService,
    private api: ApiService,
    private patientsService: PatientsService,
    private appointmentsService: AppointmentsService,
    private notificationsService: NotificationsService,
    private resultsService: ResultsService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAdmin) this.loadAdminStats();
    else if (this.authService.isDoctor) this.loadDoctorStats();
    else if (this.authService.isReceptionist) this.loadReceptionStats();

    this.translate.onLangChange.subscribe(() => {
      if (this.chartsReady) {
        this.statusChart?.destroy();
        this.monthChart?.destroy();
        this.doctorWeekChart?.destroy();
        setTimeout(() => {
          if (this.authService.isAdmin) this.drawCharts();
          else if (this.authService.isDoctor) this.drawDoctorWeekChart();
          this.cdr.detectChanges();
        }, 50);
      }
    });
  }

  private themeObserver: MutationObserver | null = null;

  ngAfterViewInit(): void {
    if (this.chartsReady) this.drawCharts();
    this.themeObserver = new MutationObserver(() => {
      if (this.chartsReady) this.drawCharts();
    });
    this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  loadQueue(appointments: any[]): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayApts = appointments
      .filter(a => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));

    this.queueTotal = todayApts.length;
    this.queueCompleted = todayApts.filter(a => a.status === 'completed').length;

    this.queueItems = todayApts.map((a, index) => {
      const patient = this.allPatients.find(p => p.id === a.patientId);
      const doctor = this.allDoctors.find(d => d.id === a.doctorId);
      return {
        queueNumber: String(index + 1).padStart(3, '0'),
        patientId: a.patientId,
        patientName: patient ? `${patient.lastName} ${patient.firstName}` : `Пациент #${a.patientId}`,
        doctorName: doctor ? `${doctor.lastName} ${doctor.firstName}` : `Врач #${a.doctorId}`,
        time: a.time,
        status: a.status
      };
    });
  }

  loadAdminStats(): void {
    forkJoin({
      stats: this.api.get<any>('/admin/stats').pipe(map(r => r.data)),
      appointments: this.appointmentsService.getAll(),
      patients: this.patientsService.getAll(),
      doctors: this.api.get<any>('/users/doctors').pipe(map(r => r.data))
    }).subscribe({
      next: ({ stats, appointments, patients, doctors }) => {
        this.adminStats = stats;
        this.allPatients = patients;
        this.allDoctors = doctors;
        this.allAppointments = appointments;
        this.loadQueue(appointments);
        this.isLoading = false;
        this.chartsReady = true;
        this.cdr.detectChanges();
        setTimeout(() => this.drawCharts(), 100);
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  loadDoctorStats(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    forkJoin({
      patients: this.patientsService.getAll(),
      appointments: this.appointmentsService.getAll(),
      results: this.resultsService.getAll()
    }).subscribe({
      next: ({ patients, appointments, results }) => {
        const me = this.authService.currentUser;
        this.allPatients = patients;

        this.doctorPatients = patients.filter((p: any) => Number(p.doctorId) === Number(me?.id)).length;
        this.doctorAppointmentsToday = appointments.filter(a => a.date === todayStr && a.doctorId === me?.id).length;
        this.doctorScheduled = appointments.filter(a => a.status === 'scheduled' && a.doctorId === me?.id).length;
        this.doctorResults = results.length;
        this.doctorAllAppointments = appointments.filter(a => a.doctorId === me?.id);

        this.todayAppointments = appointments
          .filter(a => a.date === todayStr && a.doctorId === me?.id)
          .sort((a: any, b: any) => a.time.localeCompare(b.time));

        this.upcomingAppointments = appointments
          .filter(a => a.status === 'scheduled' && a.date >= todayStr && a.doctorId === me?.id)
          .sort((a: any, b: any) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
          .slice(0, 5);

        this.todayPatients = this.todayAppointments.map(a => {
          const patient = patients.find((p: any) => p.id === a.patientId);
          return { ...a, patientName: patient ? `${patient.lastName} ${patient.firstName}` : `Пациент #${a.patientId}` };
        });

        this.recentAppointments = this.upcomingAppointments;
        this.isLoading = false;
        this.chartsReady = true;
        this.cdr.detectChanges();
        setTimeout(() => this.drawDoctorWeekChart(), 100);
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  completeAppointment(id: number): void {
    this.appointmentsService.updateStatus(id, 'completed').subscribe({
      next: () => this.loadDoctorStats()
    });
  }

  getPatientName(id: number): string {
    const p = this.allPatients.find((p: any) => p.id === id);
    return p ? `${p.lastName} ${p.firstName}` : `Пациент #${id}`;
  }

  loadReceptionStats(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    forkJoin({
      patients: this.patientsService.getAll(),
      appointments: this.appointmentsService.getAll(),
      doctors: this.api.get<any>('/users/doctors').pipe(map(r => r.data)),
      rooms: this.api.get<any>('/rooms').pipe(map(r => r.data || r))
    }).subscribe({
      next: ({ patients, appointments, doctors, rooms }) => {
        this.allPatients = patients;
        this.allDoctors = doctors;
        this.receptionPatients = patients.length;
        this.receptionAppointmentsToday = appointments.filter((a: any) => a.date === todayStr).length;
        this.receptionScheduled = appointments.filter((a: any) => a.status === 'scheduled').length;
        this.receptionTotal = appointments.length;
        this.loadQueue(appointments);

        this.receptionTodayAppointments = appointments
          .filter((a: any) => a.date === todayStr)
          .sort((a: any, b: any) => a.time.localeCompare(b.time))
          .map((a: any, index: number) => {
            const patient = patients.find((p: any) => p.id === a.patientId);
            const doctor = doctors.find((d: any) => d.id === a.doctorId);
            return {
              ...a,
              queueNumber: String(index + 1).padStart(3, '0'),
              patientName: patient ? `${patient.lastName} ${patient.firstName}` : `Пациент #${a.patientId}`,
              doctorName: doctor ? `${doctor.lastName} ${doctor.firstName}` : `Врач #${a.doctorId}`
            };
          });

        this.receptionRecentPatients = [...patients]
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        this.receptionDoctors = doctors.map((d: any) => ({
          ...d,
          isBusy: appointments.some((a: any) => {
            if (a.doctorId !== d.id || a.date !== todayStr || a.status !== 'scheduled') return false;
            const [h, m] = a.time.split(':').map(Number);
            const aptMin = h * 60 + m;
            return currentMinutes >= aptMin && currentMinutes <= aptMin + 30;
          })
        }));

        const roomsArr = Array.isArray(rooms) ? rooms : [];
        this.receptionRooms = roomsArr.map((r: any) => ({
          ...r,
          isBusy: appointments.some((a: any) => {
            if (a.roomId !== r.id || a.date !== todayStr || a.status !== 'scheduled') return false;
            const [h, m] = a.time.split(':').map(Number);
            const aptMin = h * 60 + m;
            return currentMinutes >= aptMin - 30 && currentMinutes <= aptMin + 30;
          })
        }));

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  updateAptStatus(id: number, status: string): void {
    this.appointmentsService.updateStatus(id, status as any).subscribe({
      next: () => this.loadReceptionStats()
    });
  }

  drawCharts(): void {
    this.drawStatusChart();
    this.drawMonthChart();
  }

  drawDoctorWeekChart(): void {
    const canvas = this.doctorWeekChartRef?.nativeElement;
    if (!canvas) return;
    this.doctorWeekChart?.destroy();

    const days: string[] = [];
    const counts: number[] = [];
    const lang = this.translate.currentLang || 'ru';
    const localeMap: Record<string, string> = { ru: 'ru-RU', ro: 'ro-RO', en: 'en-US' };
    const locale = localeMap[lang] || 'ru-RU';
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString(locale, { weekday: 'short' }));
      const key = d.toISOString().split('T')[0];
      counts.push(this.doctorAllAppointments.filter(a => a.date === key).length);
    }

    const colors = this.chartColors();
    this.doctorWeekChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: this.translate.instant('DASHBOARD.TOTAL_APPOINTMENTS'),
          data: counts,
          backgroundColor: colors.barBg,
          borderColor: colors.barBorder,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: colors.text, font: { size: 11 } } },
          y: { beginAtZero: true, ticks: { color: colors.text, font: { size: 11 }, stepSize: 1 }, grid: { color: colors.grid } }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.statusChart?.destroy();
    this.monthChart?.destroy();
    this.doctorWeekChart?.destroy();
    this.themeObserver?.disconnect();
  }

  private isDark(): boolean {
    return document.body.classList.contains('dark-theme');
  }

  private chartColors() {
    const dark = this.isDark();
    return {
      text: dark ? '#94a3b8' : '#718096',
      grid: dark ? '#334155' : '#f0f0f0',
      barBg: dark ? 'rgba(99,102,241,0.25)' : 'rgba(26,115,232,0.15)',
      barBorder: dark ? '#818cf8' : '#1a73e8',
    };
  }

  drawStatusChart(): void {
    const canvas = this.statusChartRef?.nativeElement;
    if (!canvas) return;
    this.statusChart?.destroy();

    const completed = this.adminStats?.completedAppointments || 0;
    const scheduled = this.adminStats?.scheduledAppointments || 0;
    const cancelled = this.adminStats?.cancelledAppointments || 0;

    const colors = this.chartColors();
    this.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: [
          this.translate.instant('DASHBOARD.COMPLETED'),
          this.translate.instant('DASHBOARD.SCHEDULED'),
          this.translate.instant('DASHBOARD.CANCELLED')
        ],
        datasets: [{
          data: [completed, scheduled, cancelled],
          backgroundColor: ['#34a853', '#1a73e8', '#ea4335'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, font: { size: 12 }, color: colors.text }
          }
        }
      }
    });
  }

  drawMonthChart(): void {
    const canvas = this.monthChartRef?.nativeElement;
    if (!canvas) return;
    this.monthChart?.destroy();

    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    this.allAppointments.forEach(a => {
      const key = a.date?.slice(0, 7);
      if (key && months[key] !== undefined) months[key]++;
    });

    const lang = this.translate.currentLang || 'ru';
    const localeMap: Record<string, string> = { ru: 'ru-RU', ro: 'ro-RO', en: 'en-US' };
    const locale = localeMap[lang] || 'ru-RU';
    const labels = Object.keys(months).map(k => {
      const d = new Date(parseInt(k.split('-')[0]), parseInt(k.split('-')[1]) - 1, 1);
      return d.toLocaleDateString(locale, { month: 'short' });
    });
    const values = Object.values(months);

    const colors = this.chartColors();
    this.monthChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: this.translate.instant('DASHBOARD.TOTAL_APPOINTMENTS'),
          data: values,
          backgroundColor: colors.barBg,
          borderColor: colors.barBorder,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.text, font: { size: 12 } }
          },
          y: {
            beginAtZero: true,
            ticks: { color: colors.text, font: { size: 12 }, stepSize: 1 },
            grid: { color: colors.grid }
          }
        }
      }
    });
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  }

  formatDate(date: string): string {
    if (!date) return '';
    const lang = this.translate.currentLang || 'ru';
    const localeMap: Record<string, string> = { ru: 'ru-RU', ro: 'ro-RO', en: 'en-US' };
    return new Date(date).toLocaleDateString(localeMap[lang] || 'ru-RU', { day: '2-digit', month: 'long' });
  }

  getQueueStatusLabel(status: string): string {
    const map: Record<string, string> = { scheduled: 'Ожидает', completed: 'Завершён', cancelled: 'Отменён' };
    return map[status] || status;
  }
}
