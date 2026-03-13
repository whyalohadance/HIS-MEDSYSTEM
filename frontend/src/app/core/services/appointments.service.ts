import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Appointment } from '../models/appointment.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  requestId: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Appointment[]> {
    return this.api.get<ApiResponse<Appointment[]>>('/appointments').pipe(
      map(res => res.data)
    );
  }

  create(data: Partial<Appointment>): Observable<Appointment> {
    return this.api.post<ApiResponse<Appointment>>('/appointments', data).pipe(
      map(res => res.data)
    );
  }

  updateStatus(id: number, status: string): Observable<Appointment> {
    return this.api.patch<ApiResponse<Appointment>>(
      `/appointments/${id}/status`, { status }
    ).pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.api.delete<ApiResponse<void>>(`/appointments/${id}`).pipe(
      map(() => void 0)
    );
  }
}
