import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PatientsService } from '../../core/services/patients.service';
import { AppointmentsService } from '../../core/services/appointments.service';
import { ExportService } from '../../core/services/export.service';
import { Patient } from '../../core/models/patient.model';
import { Appointment } from '../../core/models/appointment.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  patients: Patient[] = [];
  appointments: Appointment[] = [];
  isLoading = true;

  constructor(
    private patientsService: PatientsService,
    private appointmentsService: AppointmentsService,
    private exportService: ExportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.patientsService.getAll().subscribe({
      next: data => {
        this.patients = data;
        this.cdr.detectChanges();
      }
    });

    this.appointmentsService.getAll().subscribe({
      next: data => {
        this.appointments = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get completedAppointments(): number {
    return this.appointments.filter(a => a.status === 'completed').length;
  }

  get scheduledAppointments(): number {
    return this.appointments.filter(a => a.status === 'scheduled').length;
  }

  get cancelledAppointments(): number {
    return this.appointments.filter(a => a.status === 'cancelled').length;
  }

  async exportPatientsPDF(): Promise<void> {
    await this.exportService.exportPatientsPDF(this.patients);
  }

  exportPatientsCSV(): void {
    this.exportService.exportPatientsCSV(this.patients);
  }

  async exportAppointmentsPDF(): Promise<void> {
    await this.exportService.exportAppointmentsPDF(this.appointments);
  }

  exportAppointmentsCSV(): void {
    this.exportService.exportAppointmentsCSV(this.appointments);
  }
}
