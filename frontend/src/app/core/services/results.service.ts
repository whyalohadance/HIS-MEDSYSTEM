import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

interface ApiResponse<T> { success: boolean; data: T; }

export interface Result {
  id: number;
  patientId: number;
  doctorId: number;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ResultsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Result[]> {
    return this.api.get<ApiResponse<Result[]>>('/results').pipe(map(r => r.data));
  }

  create(data: Partial<Result>): Observable<Result> {
    return this.api.post<ApiResponse<Result>>('/results', data).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.api.delete<any>(`/results/${id}`).pipe(map(() => void 0));
  }
}
