import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Notification } from '../models/notification.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  requestId: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Notification[]> {
    return this.api.get<ApiResponse<Notification[]>>('/notifications').pipe(
      map(res => res.data)
    );
  }

  getUnreadCount(): Observable<number> {
    return this.api.get<ApiResponse<number>>('/notifications/unread-count').pipe(
      map(res => res.data)
    );
  }

  markAsRead(id: number): Observable<Notification> {
    return this.api.patch<ApiResponse<Notification>>(
      `/notifications/${id}/read`, {}
    ).pipe(map(res => res.data));
  }

  markAllAsRead(): Observable<void> {
    return this.api.patch<ApiResponse<void>>(
      '/notifications/read-all', {}
    ).pipe(map(() => void 0));
  }
}
