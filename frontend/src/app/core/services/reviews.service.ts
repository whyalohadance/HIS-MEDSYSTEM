import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Review } from '../models/review.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  requestId: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Review[]> {
    return this.api.get<ApiResponse<Review[]>>('/reviews').pipe(
      map(res => res.data)
    );
  }

  getAverageRating(): Observable<number> {
    return this.api.get<ApiResponse<number>>('/reviews/average-rating').pipe(
      map(res => res.data)
    );
  }

  create(data: Partial<Review>): Observable<Review> {
    return this.api.post<ApiResponse<Review>>('/reviews', data).pipe(
      map(res => res.data)
    );
  }
}
