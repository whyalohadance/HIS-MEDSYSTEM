import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Notification } from '../models/notification.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  requestId?: string;
  timestamp?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Notification[]> {
    return this.api.get<ApiResponse<Notification[]>>('/notifications').pipe(
      map(res => res.data || [])
    );
  }

  getUnreadCount(): Observable<number> {
    return this.api.get<ApiResponse<{ count: number }>>('/notifications/unread-count').pipe(
      map(res => res.data?.count ?? 0)
    );
  }

  markAsRead(id: number): Observable<any> {
    return this.api.patch<any>(`/notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.api.patch<any>('/notifications/read-all', {});
  }

  delete(id: number): Observable<any> {
    return this.api.delete<any>(`/notifications/${id}`);
  }
}
