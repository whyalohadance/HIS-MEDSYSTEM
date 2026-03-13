import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Patient } from '../models/patient.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  requestId: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class PatientsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Patient[]> {
    return this.api.get<ApiResponse<Patient[]>>('/patients').pipe(
      map(res => res.data)
    );
  }

  getOne(id: number): Observable<Patient> {
    return this.api.get<ApiResponse<Patient>>(`/patients/${id}`).pipe(
      map(res => res.data)
    );
  }

  create(patient: Partial<Patient>): Observable<Patient> {
    return this.api.post<ApiResponse<Patient>>('/patients', patient).pipe(
      map(res => res.data)
    );
  }

  update(id: number, patient: Partial<Patient>): Observable<Patient> {
    return this.api.put<any>(`/patients/${id}`, patient).pipe(
      map(res => {
        console.log('UPDATE response:', res);
        return res.data || res;
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.api.delete<ApiResponse<void>>(`/patients/${id}`).pipe(
      map(() => void 0)
    );
  }
}
